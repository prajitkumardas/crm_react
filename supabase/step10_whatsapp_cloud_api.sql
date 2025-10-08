-- WhatsApp Cloud API Schema (following the instruction)

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  client_id INTEGER,
  phone VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- 'text' or 'template'
  template_name VARCHAR,
  message_text TEXT,
  provider_message_id VARCHAR,
  status VARCHAR DEFAULT 'pending',
  error_text TEXT,
  attempt_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create sent_triggers table for deduplication
CREATE TABLE IF NOT EXISTS sent_triggers (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  trigger_type VARCHAR NOT NULL, -- 'birthday', 'expiry_3days', 'expiry_on', 'expiry_3after'
  trigger_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_id, trigger_type, trigger_date)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_sent_triggers_client_trigger ON sent_triggers(client_id, trigger_type, trigger_date);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();