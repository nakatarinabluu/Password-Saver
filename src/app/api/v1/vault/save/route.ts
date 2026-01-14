import { NextRequest, NextResponse } from 'next/server';
import { db, redis } from '@/lib/db';
import { encrypt } from '@/lib/encryption';
import { z } from 'zod';

export const runtime = 'edge';

// Strict Schema Validation
const SaveSchema = z.object({
    id: z.string().uuid(),
    owner_hash: z.string().min(32),
    title_hash: z.string().min(1),
    encrypted_blob: z.string().min(1),
    iv: z.string().min(1),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Zod Validation
        const result = SaveSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({
                error: 'Validation Failed',
                details: result.error.flatten()
            }, { status: 400 });
        }

        const { id, owner_hash, title_hash, encrypted_blob, iv } = result.data;

        const pepperNeon = process.env.PEPPER_NEON;
        const pepperRedis = process.env.PEPPER_REDIS;

        if (!pepperNeon || !pepperRedis) {
            // Enterprise: Silent fail or generic 500 in prod, but log internally if logger exists
            console.error('CRITICAL: Missing PEPPER configuration');
            return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
        }

        // 1. Split the original encrypted_blob FIRST
        const mid = Math.floor(encrypted_blob.length / 2);
        const rawPartA = encrypted_blob.slice(0, mid);
        const rawPartB = encrypted_blob.slice(mid);

        // 2. Dual-Key Encryption
        // Part A -> Neon (Encrypted with PEPPER_NEON)
        const content_a = await encrypt(rawPartA, pepperNeon);

        // Part B -> Redis (Encrypted with PEPPER_REDIS)
        const content_b = await encrypt(rawPartB, pepperRedis);

        // 3. Save the first half to Neon (vault_shards_a)
        const saveToNeon = db.query(
            'INSERT INTO vault_shards_a (id, owner_hash, title_hash, content_a, iv) VALUES ($1, $2, $3, $4, $5)',
            [id, owner_hash, title_hash, content_a, iv]
        );

        // 4. Save the second half to Upstash Redis (shard_b:{id})
        const saveToRedis = redis.set(`shard_b:${id}`, content_b);

        await Promise.all([saveToNeon, saveToRedis]);

        return NextResponse.json({ message: 'Securely Stored' }, { status: 201 });
    } catch (error) {
        // Enterprise: Never expose stack trace to client
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
