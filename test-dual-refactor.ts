// Usage: npx tsx test-dual-refactor.ts
// Pre-requisites: .env.local must have NEON_DATABASE_URL and SUPABASE_DATABASE_URL
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { v4 as uuidv4 } from 'uuid';

async function runTest() {
    console.log("🚀 Starting Dual-Sharding Verification Test");

    // Dynamic Import to ensure Env is loaded first
    const { VaultRepositoryImpl } = await import('./src/repositories/VaultRepositoryImpl');
    const { dbNeon, dbSupabase } = await import('./src/lib/db');
    const { LoggerService } = await import('./src/services/LoggerService');

    const repo = new VaultRepositoryImpl();
    const testId = uuidv4();
    const ownerHash = 'test_owner_hash_' + Date.now();
    const testBlob = 'SUPER_SECRET_PAYLOAD_ABCDEFGHIJKLMNOPQRSTUVWXYZ_1234567890';
    const iv = 'iv_test_123';

    try {
        // 1. Test SAVE
        console.log(`\n[TEST 1] Saving Secret (${testId})...`);
        await repo.save(testId, ownerHash, testBlob, iv);
        console.log("✅ Save Completed.");

        // Verify Fragments
        console.log("[VERIFY] Checking Shards...");
        const resA = await dbNeon.query('SELECT * FROM vault_shards_a WHERE id = $1', [testId]);
        const resB = await dbSupabase.query('SELECT * FROM vault_shards_b WHERE id = $1', [testId]);

        if (resA.rows.length === 1 && resB.rows.length === 1) {
            console.log("✅ Shards found in both Neon and Supabase.");
        } else {
            console.error("❌ Shard verification failed!", { neon: resA.rows.length, supabase: resB.rows.length });
        }

        // 2. Test READ
        console.log(`\n[TEST 2] Fetching Secrets for Owner...`);
        const results = await repo.fetchByOwner(ownerHash);
        if (results.length === 1 && results[0].encrypted_blob === testBlob) {
            console.log("✅ Fetch & Reassembly Successful!");
        } else {
            console.error("❌ Fetch mismatch", results);
        }

        // 3. Test DELETE
        console.log(`\n[TEST 3] Cleanup (Delete)...`);
        await repo.delete(testId);
        const resA_del = await dbNeon.query('SELECT * FROM vault_shards_a WHERE id = $1', [testId]);
        const resB_del = await dbSupabase.query('SELECT * FROM vault_shards_b WHERE id = $1', [testId]);

        if (resA_del.rows.length === 0 && resB_del.rows.length === 0) {
            console.log("✅ Helper deletion successful.");
        } else {
            console.warn("⚠️ Deletion might have failed or lagged.");
        }

        // 4. Test LOGGING
        console.log(`\n[TEST 4] Verifying LoggerService (MongoDB)...`);
        const { LoggerService } = await import('./src/services/LoggerService');
        // We use dynamic import or ensure tsx handles aliases. 
        // Note: tsx might need explicit path if aliases aren't picked up, but tsconfig usually handles it.
        // Let's try standard import if at top, but here dynamic is safer for the script structure.

        LoggerService.info("Dual-Sharding Test Run Completed", { testId });
        console.log("✅ Log command sent (Async). Check Atlas Dashboard for entry.");

    } catch (e) {
        console.error("❌ Test Failed with Exception:", e);
    }
}

runTest();
