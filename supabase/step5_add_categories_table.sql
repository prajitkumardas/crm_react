-- Add category column to packages table if it doesn't exist
ALTER TABLE packages ADD COLUMN IF NOT EXISTS category VARCHAR(255);

-- Set default category for existing packages
UPDATE packages SET category = 'General' WHERE category IS NULL OR category = '';

-- Make category NOT NULL
ALTER TABLE packages ALTER COLUMN category SET NOT NULL;