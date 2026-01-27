import { dbNeon, dbSupabase } from '@/lib/db';
import { redis } from '@/lib/redis';
import { encrypt, decrypt } from '@/lib/encryption';
import { IVaultRepository, VaultRecord } from './IVaultRepository';

import { LoggerService } from '@/services/LoggerService';

export class DependencyFailureException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DependencyFailureException';
    }
}

export class VaultRepositoryImpl implements IVaultRepository {
    private pepperNeon: string;
    private pepperSupabase: string;
    private schema: string;

    constructor() {
        const neon = process.env.PEPPER_NEON;
        const supabasePepper = process.env.PEPPER_SUPABASE || process.env.PEPPER_REDIS;

        if (!neon || !supabasePepper) {
            throw new Error('CRITICAL: Missing PEPPER configuration');
        }

        this.pepperNeon = neon;
        this.pepperSupabase = supabasePepper;

        // Multi-Schema Support (Pillar 3: High Scale / Multi-Tenancy)
        const rawSchema = process.env.DB_SCHEMA || 'zerokeep';
        if (!/^[a-zA-Z0-9_]+$/.test(rawSchema)) {
            throw new Error("Invalid DB_SCHEMA: Must be alphanumeric only.");
        }
        this.schema = rawSchema;
    }

    /**
     * Resilient Save with Write-Through Pattern
     */
    async save(id: string, ownerHash: string, encryptedBlob: string, iv: string, orderIndex: number = 0, forceSql: boolean = false): Promise<void> {
        try {
            // 2PC PROTOCOL BEGIN (Attempt Direct SQL Write)
            await this.performTwoPhaseCommit(id, ownerHash, encryptedBlob, iv, orderIndex);
        } catch (sqlError) {
            console.error("SQL WRITE FAILED FATALLY:", sqlError);
            if (forceSql) {
                LoggerService.error(`[SYNC WORKER] SQL Write Failed for ${id}. Retention in Redis continued.`, sqlError);
                throw sqlError;
            }

            LoggerService.warn(`[WRITE-THROUGH] SQL Providers Down. Parking write for ID ${id} in Redis.`, { error: (sqlError as any)?.message });

            try {
                const timestamp = Date.now();
                const parkKey = `temp_vault:${id}:${timestamp}`;
                const payload = {
                    id,
                    ownerHash,
                    encryptedBlob,
                    iv,
                    orderIndex,
                    timestamp
                };

                await redis.set(parkKey, JSON.stringify(payload), { ex: 86400 }); // 24 Hours
                LoggerService.info(`[WRITE-THROUGH] Success. Data parked in ${parkKey}.`);

                return;
            } catch (redisError) {
                LoggerService.error(`[CRITICAL] TOTAL SYSTEM FAILURE. Redis and SQL both down for ${id}.`, redisError);
                throw new Error('Service Unavailable: Durable Storage Unreachable.');
            }
        }
    }

    private async performTwoPhaseCommit(id: string, ownerHash: string, encryptedBlob: string, iv: string, orderIndex: number): Promise<void> {
        const mid = Math.floor(encryptedBlob.length / 2);
        const rawPartA = encryptedBlob.slice(0, mid); // Goes to Neon
        const rawPartB = encryptedBlob.slice(mid);    // Goes to Supabase

        const content_a = await encrypt(rawPartA, this.pepperNeon);
        const content_b = await encrypt(rawPartB, this.pepperSupabase);

        try {
            // 1. NEON PREPARE (Primary)
            await dbNeon.query(
                `INSERT INTO ${this.schema}.vault_shards_a (id, owner_hash, content_a, iv, order_index, status) 
                 VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
                [id, ownerHash, content_a, iv, orderIndex]
            );

            // 2. SUPABASE PREPARE (Secondary)
            await dbSupabase.query(
                `INSERT INTO ${this.schema}.vault_shards_b (id, owner_hash, content_encrypted, iv, status) 
                 VALUES ($1, $2, $3, $4, 'PENDING')`,
                [id, ownerHash, content_b, iv]
            );

        } catch (prepareError) {
            console.error("PREPARE FAILED DETAILS:", prepareError);
            LoggerService.error(`[2PC] Prepare Failed for ID ${id}. Rolling back Neon.`, prepareError);
            try {
                await dbNeon.query(`DELETE FROM ${this.schema}.vault_shards_a WHERE id = $1`, [id]);
            } catch (rbError) {
                LoggerService.error(`[2PC] FATAL: Manual Rollback Failed for ${id}`, rbError);
            }
            throw new Error('Transaction Failed during Prepare Phase.');
        }

        try {
            await dbNeon.query(`UPDATE ${this.schema}.vault_shards_a SET status = 'ACTIVE' WHERE id = $1`, [id]);
            await dbSupabase.query(`UPDATE ${this.schema}.vault_shards_b SET status = 'ACTIVE' WHERE id = $1`, [id]);
        } catch (commitError) {
            console.warn(`[2PC] Commit Partial Failure for ${id}. Supabase may be stuck in PENDING.`);
        }
    }

    async fetchByOwner(ownerHash: string): Promise<VaultRecord[]> {
        const queryNeon = dbNeon.query(
            `SELECT id, content_a, iv, order_index FROM ${this.schema}.vault_shards_a WHERE owner_hash = $1 AND status = 'ACTIVE' ORDER BY order_index ASC`,
            [ownerHash]
        );

        const querySupabase = dbSupabase.query(
            `SELECT id, content_encrypted FROM ${this.schema}.vault_shards_b WHERE owner_hash = $1 AND status = 'ACTIVE'`,
            [ownerHash]
        );

        const [resultA, resultB] = await Promise.all([queryNeon, querySupabase]);

        const shardsA = resultA.rows;
        const shardsB = resultB.rows;

        if (!shardsA || shardsA.length === 0) {
            return [];
        }
        const mapB = new Map(shardsB.map((r: any) => [r.id, r.content_encrypted]));
        const results: VaultRecord[] = [];

        for (const rowA of shardsA) {
            const encryptedContentB = mapB.get(rowA.id);

            if (!encryptedContentB) {
                LoggerService.security('Data Integrity Check Failed: Missing Part B', { resourceId: rowA.id });
                console.error(`[CRITICAL] Shard Mismatch! ID ${rowA.id} missing in Supabase. Skipping.`);
                continue;
            }

            try {
                const partA = await decrypt(rowA.content_a, this.pepperNeon);
                const partB = await decrypt(encryptedContentB, this.pepperSupabase);

                results.push({
                    id: rowA.id,
                    owner_hash: ownerHash,
                    encrypted_blob: partA + partB,
                    iv: rowA.iv,
                    order_index: rowA.order_index
                });
            } catch (e) {
                LoggerService.error(`Decryption Failed for ID: ${rowA.id}`, e);
            }
        }

        return results;
    }

    async delete(id: string): Promise<void> {
        const delNeon = dbNeon.query(`DELETE FROM ${this.schema}.vault_shards_a WHERE id = $1`, [id]);
        const delSupabase = dbSupabase.query(`DELETE FROM ${this.schema}.vault_shards_b WHERE id = $1`, [id]);

        await Promise.allSettled([delNeon, delSupabase]);
    }

    async wipeByOwner(ownerHash: string): Promise<void> {
        const delNeon = dbNeon.query(`DELETE FROM ${this.schema}.vault_shards_a WHERE owner_hash = $1`, [ownerHash]);
        const delSupabase = dbSupabase.query(`DELETE FROM ${this.schema}.vault_shards_b WHERE owner_hash = $1`, [ownerHash]);

        await Promise.allSettled([delNeon, delSupabase]);
    }

    async reorder(items: { id: string; order: number }[], ownerHash: string): Promise<void> {
        if (items.length === 0) return;

        const updates = items.map(item =>
            dbNeon.query(
                `UPDATE ${this.schema}.vault_shards_a SET order_index = $1 WHERE id = $2 AND owner_hash = $3`,
                [item.order, item.id, ownerHash]
            )
        );

        await Promise.all(updates);
    }
}
