-- WhatsApp Automation Tables

-- Add WhatsApp number column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- WhatsApp Settings table for storing API credentials and global settings
CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  provider VARCHAR(50) DEFAULT 'twilio', -- 'twilio' or 'whatsapp_business'
  api_key TEXT,
  api_secret TEXT,
  account_sid TEXT, -- for Twilio
  phone_number VARCHAR(20), -- sender phone number
  business_account_id TEXT, -- for WhatsApp Business API
  access_token TEXT, -- for WhatsApp Business API
  message_header TEXT DEFAULT 'Smart Client Manager',
  message_footer TEXT DEFAULT 'Thank you!',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- WhatsApp Templates table for storing message templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL, -- 'birthday', 'expiry_3_days_before', 'expiry_on_date', 'expiry_3_days_after', 'custom'
  name VARCHAR(100) NOT NULL,
  message_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, template_type)
);

-- Note: Default templates will be created programmatically when organizations
-- first access WhatsApp settings to avoid foreign key constraint issues

-- WhatsApp Message Logs table for tracking sent messages
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  message_type VARCHAR(50) NOT NULL, -- 'birthday', 'expiry_reminder', 'bulk', 'custom'
  template_id UUID REFERENCES whatsapp_templates(id),
  recipient_phone VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(100),
  message_content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'failed', 'pending'
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Scheduled Messages table for custom events and bulk messages
CREATE TABLE IF NOT EXISTS whatsapp_scheduled_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  message_type VARCHAR(50) NOT NULL, -- 'bulk', 'custom_event'
  title VARCHAR(200) NOT NULL,
  message_text TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  is_sent BOOLEAN DEFAULT false,
  target_clients JSONB, -- array of client IDs or filter criteria
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_whatsapp_number ON clients(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_org ON whatsapp_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_org_type ON whatsapp_templates(organization_id, template_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_org_client ON whatsapp_logs(organization_id, client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_sent_at ON whatsapp_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_org ON whatsapp_scheduled_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_date ON whatsapp_scheduled_messages(scheduled_date) WHERE is_sent = false;

-- Enable RLS (Row Level Security)
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_scheduled_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view whatsapp settings for their organization" ON whatsapp_settings
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage whatsapp settings for their organization" ON whatsapp_settings
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view whatsapp templates for their organization" ON whatsapp_templates
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage whatsapp templates for their organization" ON whatsapp_templates
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view whatsapp logs for their organization" ON whatsapp_logs
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage whatsapp logs for their organization" ON whatsapp_logs
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view scheduled messages for their organization" ON whatsapp_scheduled_messages
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage scheduled messages for their organization" ON whatsapp_scheduled_messages
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_whatsapp_settings_updated_at
  BEFORE UPDATE ON whatsapp_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();