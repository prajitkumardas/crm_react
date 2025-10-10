-- Subscription Management Schema
-- Run this after the main schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan_name TEXT CHECK (plan_name IN ('Free', 'Starter', 'Growth', 'Pro')) DEFAULT 'Free',
  status TEXT CHECK (status IN ('active', 'expired', 'grace', 'canceled')) DEFAULT 'active',
  client_limit INT DEFAULT 50,
  next_billing_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  razorpay_subscription_id TEXT,
  razorpay_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Billing history table
CREATE TABLE billing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  plan_name TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'INR',
  invoice_url TEXT,
  payment_status TEXT CHECK (payment_status IN ('success', 'failed', 'pending', 'refunded')) DEFAULT 'pending',
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  billing_period_start DATE,
  billing_period_end DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add-ons table for additional features
CREATE TABLE subscription_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  addon_name TEXT,
  addon_type TEXT CHECK (addon_type IN ('sms_credits', 'email_credits', 'api_calls', 'storage')),
  quantity INT DEFAULT 1,
  amount DECIMAL(10,2),
  status TEXT CHECK (status IN ('active', 'expired', 'canceled')) DEFAULT 'active',
  expiry_date DATE,
  razorpay_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plan features table for dynamic feature management
CREATE TABLE plan_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_name TEXT CHECK (plan_name IN ('Free', 'Starter', 'Growth', 'Pro')),
  feature_name TEXT,
  feature_value TEXT, -- Can be 'true', 'false', number, or text
  feature_type TEXT CHECK (feature_type IN ('boolean', 'number', 'text', 'unlimited')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plan features
INSERT INTO plan_features (plan_name, feature_name, feature_value, feature_type) VALUES
-- Free Plan
('Free', 'client_limit', '50', 'number'),
('Free', 'team_members', '1', 'number'),
('Free', 'automation', 'false', 'boolean'),
('Free', 'bulk_messaging', 'false', 'boolean'),
('Free', 'api_access', 'false', 'boolean'),
('Free', 'reports', 'basic', 'text'),
('Free', 'support', 'community', 'text'),

-- Starter Plan
('Starter', 'client_limit', '500', 'number'),
('Starter', 'team_members', '3', 'number'),
('Starter', 'automation', 'true', 'boolean'),
('Starter', 'bulk_messaging', 'true', 'boolean'),
('Starter', 'api_access', 'false', 'boolean'),
('Starter', 'reports', 'basic', 'text'),
('Starter', 'support', 'email', 'text'),

-- Growth Plan
('Growth', 'client_limit', '2000', 'number'),
('Growth', 'team_members', '10', 'number'),
('Growth', 'automation', 'true', 'boolean'),
('Growth', 'bulk_messaging', 'true', 'boolean'),
('Growth', 'api_access', 'false', 'boolean'),
('Growth', 'reports', 'advanced', 'text'),
('Growth', 'support', 'chat', 'text'),

-- Pro Plan
('Pro', 'client_limit', 'unlimited', 'unlimited'),
('Pro', 'team_members', 'unlimited', 'unlimited'),
('Pro', 'automation', 'true', 'boolean'),
('Pro', 'bulk_messaging', 'true', 'boolean'),
('Pro', 'api_access', 'true', 'boolean'),
('Pro', 'reports', 'advanced', 'text'),
('Pro', 'support', '24x7', 'text');

-- Create indexes for better performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_billing_history_user_id ON billing_history(user_id);
CREATE INDEX idx_billing_history_subscription_id ON billing_history(subscription_id);
CREATE INDEX idx_plan_features_plan_name ON plan_features(plan_name);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for billing_history
CREATE POLICY "Users can view their own billing history" ON billing_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own billing history" ON billing_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for subscription_addons
CREATE POLICY "Users can view their own addons" ON subscription_addons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own addons" ON subscription_addons
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for plan_features (public read access)
CREATE POLICY "Anyone can view plan features" ON plan_features
  FOR SELECT USING (true);

-- Function to create default subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, organization_id, plan_name, status, client_limit)
  VALUES (NEW.id, NEW.organization_id, 'Free', 'active', 50);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default subscription when user profile is created
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_subscription();

-- Function to update subscription updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for subscriptions table
CREATE TRIGGER update_subscription_timestamp
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();