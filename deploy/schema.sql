-- Culture Node schema (from src/db/schema.ts)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  username TEXT,
  wallet_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(uid),
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  status TEXT NOT NULL,
  reply TEXT
);

CREATE TABLE IF NOT EXISTS attention_verifications (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  wallet_address TEXT,
  session_id TEXT NOT NULL,
  title TEXT NOT NULL,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  verification TEXT NOT NULL,
  reason TEXT NOT NULL,
  model TEXT,
  attest_signature TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_proofs (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  signature TEXT NOT NULL UNIQUE,
  verified BOOLEAN NOT NULL,
  slot TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO culture_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO culture_app;
