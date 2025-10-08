-- Chatwoot-based Messaging System Schema
-- Clean, multi-channel messaging with templates

-- Update clients table to add Chatwoot conversation ID
ALTER TABLE clients ADD COLUMN IF NOT EXISTS chatwoot_conversation_id BIGINT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan_start DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan_expiry DATE;

-- Templates table for message templates
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- e.g., 'birthday', 'plan_expiry', 'plan_expired', 'marketing'
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message logs table for tracking sent messages
CREATE TABLE IF NOT EXISTS message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),
  template_name TEXT,
  channel TEXT NOT NULL, -- 'whatsapp', 'telegram', 'email', 'sms'
  conversation_id BIGINT,
  message_content TEXT NOT NULL,
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'failed'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT
);

-- Insert default templates
INSERT INTO message_templates (name, content) VALUES
('birthday', 'Happy Birthday, {name}! 🎉 Wishing you a fantastic day!'),
('plan_expiry', 'Hi {name}, your {plan_name} plan is expiring on {plan_expiry}. Renew soon!'),
('plan_expired', 'Hi {name}, your {plan_name} plan has expired. Reactivate now!'),
('marketing', 'Hey {name}, check out our new offers this month!')
ON CONFLICT (name) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_birthday ON clients(birthday);
CREATE INDEX IF NOT EXISTS idx_clients_plan_expiry ON clients(plan_expiry);
CREATE INDEX IF NOT EXISTS idx_clients_chatwoot_conversation ON clients(chatwoot_conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_client_id ON message_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_sent_at ON message_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_message_templates_name ON message_templates(name);

-- Enable RLS on new tables
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_templates
CREATE POLICY "Users can manage message templates in their organization" ON message_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.organization_id = get_user_organization()
      LIMIT 1
    )
  );

-- RLS Policies for message_logs
CREATE POLICY "Users can view message logs for their organization" ON message_logs
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE organization_id = get_user_organization()
    )
  );

CREATE POLICY "Users can insert message logs for their organization" ON message_logs
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE organization_id = get_user_organization()
    )
  );

-- Update trigger for templates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();