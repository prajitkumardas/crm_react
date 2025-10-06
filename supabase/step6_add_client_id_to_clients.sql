-- Simple client ID assignment - no window functions
DO $$
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'clients' AND column_name = 'client_id') THEN
    ALTER TABLE clients ADD COLUMN client_id VARCHAR(20);
    ALTER TABLE clients ADD CONSTRAINT clients_client_id_unique UNIQUE (client_id);
  END IF;
END $$;

-- Assign IDs using a simple loop
DO $$
DECLARE
  client_rec RECORD;
  counter INTEGER := 100; -- Start from 100
BEGIN
  FOR client_rec IN
    SELECT id FROM clients
    WHERE client_id IS NULL
    ORDER BY created_at
  LOOP
    UPDATE clients
    SET client_id = 'CLI-' || LPAD(counter::TEXT, 3, '0')
    WHERE id = client_rec.id;

    counter := counter + 1;
  END LOOP;
END $$;

-- Create trigger for future clients
CREATE OR REPLACE FUNCTION generate_client_id()
RETURNS TRIGGER AS $$
DECLARE
  next_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(client_id FROM 5) AS INTEGER)), 0) + 1
  INTO next_id
  FROM clients
  WHERE organization_id = NEW.organization_id;

  NEW.client_id := 'CLI-' || LPAD(next_id::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_client_id_trigger ON clients;
CREATE TRIGGER generate_client_id_trigger
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION generate_client_id();