require('dotenv').config({ path: '.env.local' });
const { Pool } = require('@neondatabase/serverless');

async function migrate() {
    const pool = new Pool({
        connectionString: process.env.NEON_DATABASE_URL,
    });

    try {
        console.log('Adding owner_hash column...');
        // We use ADD COLUMN IF NOT EXISTS logic (Postgres 9.6+ supports IF NOT EXISTS)
        // But standard SQL often is just ADD COLUMN and fail if exists.
        // Let's try standard ADD COLUMN, ignore error if it says 'duplicate column'.

        await pool.query('ALTER TABLE vault_shards_a ADD COLUMN IF NOT EXISTS owner_hash TEXT NOT NULL DEFAULT \'unknown\';');
        // Remove default after? Or keep it? The requirement implies it should be there.
        // Let's remove the default constraint if we want it to be pure.
        await pool.query('ALTER TABLE vault_shards_a ALTER COLUMN owner_hash DROP DEFAULT;');

        console.log('Migration successful: owner_hash added.');
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await pool.end();
    }
}

migrate();
