ALTER TABLE doctors ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMP;
