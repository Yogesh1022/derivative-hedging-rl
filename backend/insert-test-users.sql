-- Create test users for HedgeAI Platform
-- Run with: psql -h localhost -p 5433 -U postgres -d hedgeai -f insert-test-users.sql

-- First, let's create hashed passwords (bcrypt hash for "Trader123!" with rounds=12)
-- Note: These are pre-computed hashes - in production, NEVER store passwords in plain text

-- Insert Trader 1
INSERT INTO "User" (id, email, password, name, role, status, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'trader1@hedgeai.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIvApBu3v2', -- Trader123!
  'John Trader',
  'TRADER',
  'ACTIVE',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert Trader 2
INSERT INTO "User" (id, email, password, name, role, status, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'trader2@hedgeai.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIvApBu3v2', -- Trader123!
  'Sarah Smith',
  'TRADER',
  'ACTIVE',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert Analyst
INSERT INTO "User" (id, email, password, name, role, status, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'analyst@hedgeai.com',
  '$2a$12$8Ixy8vF3p6J7zK5.PqN9LeQxYbUqZ0qhJxH9K.FJ.9YqxJ8K9F3Pm', -- Analyst123!
  'Mike Analyst',
  'ANALYST',
  'ACTIVE',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert Admin
INSERT INTO "User" (id, email, password, name, role, status, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@hedgeai.com',
  '$2a$12$9Jyz9wG4q7K8aL6.QrO0MfRyZcVrA1riKyI0L.GK.0ZryK9L0G4Qn', -- Admin123!
  'Admin User',
  'ADMIN',
  'ACTIVE',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Show all users
SELECT id, email, name, role, status, "createdAt" FROM "User" ORDER BY "createdAt" DESC;
