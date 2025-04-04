-- Migration to add Express session table for Passport authentication
-- This table is required by connect-pg-simple for session storage

-- Create the session table
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- Add index for faster session expiration lookups
CREATE INDEX "IDX_session_expire" ON "session" ("expire");

-- Add comment for documentation
COMMENT ON TABLE "session" IS 'Express session storage for Passport authentication'; 