-- Add gender, emergency_contact_name, and emergency_contact_phone columns to clients table
ALTER TABLE clients ADD COLUMN gender VARCHAR(20);
ALTER TABLE clients ADD COLUMN emergency_contact_name VARCHAR(255);
ALTER TABLE clients ADD COLUMN emergency_contact_phone VARCHAR(20);