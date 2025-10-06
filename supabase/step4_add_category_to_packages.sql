-- Add category column to packages table
ALTER TABLE packages ADD COLUMN category VARCHAR(100);

-- Update existing packages to have a default category
UPDATE packages SET category = 'Gym - Monthly' WHERE category IS NULL;