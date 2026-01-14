-- Table: vault_shards_a
CREATE TABLE IF NOT EXISTS vault_shards_a (
  id UUID PRIMARY KEY,
  owner_hash TEXT NOT NULL,
  title_hash TEXT NOT NULL,
  content_a TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
