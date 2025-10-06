-- Smart Client Manager Database Schema
-- Following the exact requirements provided

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations / Workspaces table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID, -- Will reference profiles(id) after profiles table is created
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'staff', -- admin, staff, trainer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Now add the foreign key constraint for organizations.owner_id
ALTER TABLE organizations ADD CONSTRAINT fk_organizations_owner
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id VARCHAR(20) UNIQUE NOT NULL, -- Human-readable unique ID like CLI-001
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packages table
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  category VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Packages (Assignments) table
CREATE TABLE client_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'upcoming', -- upcoming, active, expired
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, package_id, start_date)
);

-- Check-ins (Attendance) table
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row-Level Security (RLS) Policies

-- Function to get user's organization without recursion
CREATE OR REPLACE FUNCTION get_user_organization()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view organizations they own or belong to" ON organizations
  FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Organization owners can update their organization" ON organizations
  FOR UPDATE USING (owner_id = auth.uid());

-- Profiles policies
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Clients policies
CREATE POLICY "Users can manage clients in their organization" ON clients
  FOR ALL USING (organization_id = get_user_organization());

-- Packages policies
CREATE POLICY "Users can manage packages in their organization" ON packages
  FOR ALL USING (organization_id = get_user_organization());

-- Client packages policies
CREATE POLICY "Users can manage client packages in their organization" ON client_packages
  FOR ALL USING (
    client_id IN (
      SELECT id FROM clients WHERE organization_id = get_user_organization()
    )
  );

-- Checkins policies
CREATE POLICY "Users can manage checkins in their organization" ON checkins
  FOR ALL USING (
    client_id IN (
      SELECT id FROM clients WHERE organization_id = get_user_organization()
    )
  );

-- Function for auto-status updates on client_packages
CREATE OR REPLACE FUNCTION update_client_package_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate status based on dates
  IF NEW.start_date > CURRENT_DATE THEN
    NEW.status := 'upcoming';
  ELSIF NEW.end_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  ELSE
    NEW.status := 'active';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-status updates
CREATE TRIGGER update_client_package_status_trigger
  BEFORE INSERT OR UPDATE ON client_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_client_package_status();

-- Indexes for performance
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_clients_organization ON clients(organization_id);
CREATE INDEX idx_packages_organization ON packages(organization_id);
CREATE INDEX idx_client_packages_client ON client_packages(client_id);
CREATE INDEX idx_client_packages_status ON client_packages(status);
CREATE INDEX idx_checkins_client ON checkins(client_id);