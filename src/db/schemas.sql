-- NEON DATABASE (Shard A)
CREATE TABLE IF NOT EXISTS vault_shards_a (
  id UUID PRIMARY KEY,
  owner_hash TEXT NOT NULL,
  content_a TEXT NOT NULL, -- Encrypted Part A
  order_index INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE')),
  cleanup_timestamp TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '15 minutes'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vault_shards_a_owner ON vault_shards_a(owner_hash);
CREATE INDEX IF NOT EXISTS idx_vault_shards_a_status_cleanup ON vault_shards_a(status, cleanup_timestamp);

-- SUPABASE DATABASE (Shard B)
-- Execute this on your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS vault_shards_b (
  id UUID PRIMARY KEY,
  owner_hash TEXT NOT NULL,
  content_encrypted TEXT NOT NULL, -- Encrypted Part B
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vault_shards_b_owner ON vault_shards_b(owner_hash);
