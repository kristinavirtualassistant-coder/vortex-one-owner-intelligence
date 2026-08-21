-- Vortex One Owner Intelligence Database Schema (PostgreSQL + PostGIS)

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Counties Table (Supporting all 58 CA counties, Orange County primary)
CREATE TABLE IF NOT EXISTS counties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code VARCHAR(2) NOT NULL DEFAULT 'CA',
  county_code VARCHAR(10) NOT NULL,
  fips_code VARCHAR(10) UNIQUE NOT NULL,
  county_name VARCHAR(100) NOT NULL,
  state_name VARCHAR(100) NOT NULL DEFAULT 'California',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Source Registry Table
CREATE TABLE IF NOT EXISTS source_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
  source_category VARCHAR(50) NOT NULL,
  source_name VARCHAR(150) NOT NULL,
  agency_name VARCHAR(150) NOT NULL,
  endpoint_url TEXT,
  documentation_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'UNVERIFIED', -- VERIFIED, PROBABLE, UNVERIFIED, INVALID, CONFLICT, NOT_CONFIGURED
  schema_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  last_verified_at TIMESTAMP WITH TIME ZONE,
  last_success_at TIMESTAMP WITH TIME ZONE,
  last_failure_at TIMESTAMP WITH TIME ZONE,
  record_count BIGINT DEFAULT 0,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Properties Table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_key VARCHAR(150) UNIQUE NOT NULL,
  formatted_address TEXT NOT NULL,
  street_number VARCHAR(50),
  street_name VARCHAR(150),
  unit VARCHAR(50),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL DEFAULT 'CA',
  zip_code VARCHAR(20) NOT NULL,
  census_tract VARCHAR(50),
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  geometry GEOMETRY(Point, 4326),
  source_id UUID REFERENCES source_registry(id),
  source_jurisdiction VARCHAR(100),
  retrieved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_properties_property_key ON properties(property_key);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_zip ON properties(zip_code);
CREATE INDEX IF NOT EXISTS idx_properties_geom ON properties USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_properties_address_trgm ON properties USING gin (formatted_address gin_trgm_ops);

-- 4. Parcels Table
CREATE TABLE IF NOT EXISTS parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apn VARCHAR(50) NOT NULL,
  canonical_apn VARCHAR(50) NOT NULL,
  raw_apn VARCHAR(50) NOT NULL,
  apn_format VARCHAR(30) NOT NULL DEFAULT 'OC_8_DIGIT',
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  county_id UUID REFERENCES counties(id),
  fips_county_code VARCHAR(10) NOT NULL DEFAULT '06059',
  land_assessed_value NUMERIC(14, 2) DEFAULT 0,
  improvement_assessed_value NUMERIC(14, 2) DEFAULT 0,
  total_assessed_value NUMERIC(14, 2) DEFAULT 0,
  use_code VARCHAR(100),
  year_built INTEGER,
  units INTEGER DEFAULT 1,
  bedrooms INTEGER DEFAULT 0,
  tax_rate_area VARCHAR(50),
  roll_year INTEGER DEFAULT 2026,
  source_id UUID REFERENCES source_registry(id),
  retrieved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parcels_canonical_apn ON parcels(canonical_apn);
CREATE INDEX IF NOT EXISTS idx_parcels_property_id ON parcels(property_id);

-- 5. Owners Table
CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255) NOT NULL,
  owner_type VARCHAR(50) NOT NULL DEFAULT 'INDIVIDUAL',
  mailing_address TEXT,
  is_owner_occupied BOOLEAN DEFAULT false,
  corporate_officer VARCHAR(255),
  officer_title VARCHAR(150),
  registered_agent VARCHAR(255),
  business_address TEXT,
  sos_file_number VARCHAR(50),
  sos_status VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_owners_normalized_name ON owners USING gin (normalized_name gin_trgm_ops);

-- 6. Owner-Property Relationship
CREATE TABLE IF NOT EXISTS owner_property (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) DEFAULT 'PRIMARY_OWNER',
  is_current BOOLEAN DEFAULT true,
  source_id UUID REFERENCES source_registry(id),
  confidence NUMERIC(4, 3) DEFAULT 1.000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_owner_property_owner ON owner_property(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_property_property ON owner_property(property_id);

-- 7. Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  person_id UUID,
  contact_value VARCHAR(255) NOT NULL,
  contact_type VARCHAR(50) NOT NULL, -- PHONE, MOBILE, LANDLINE, EMAIL, WEBSITE
  is_tracked_line BOOLEAN DEFAULT false,
  source_id UUID REFERENCES source_registry(id),
  source_url TEXT,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'VERIFIED',
  confidence NUMERIC(4, 3) DEFAULT 0.900,
  evidence_hash VARCHAR(64) NOT NULL,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Provenance Table
CREATE TABLE IF NOT EXISTS provenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  source_id UUID REFERENCES source_registry(id),
  raw_payload_id VARCHAR(100),
  classification VARCHAR(30) NOT NULL DEFAULT 'FACT', -- FACT, INFERENCE, UNVERIFIED, CONFLICT
  confidence NUMERIC(4, 3) DEFAULT 1.000,
  value_recorded TEXT,
  provenance_hash VARCHAR(64) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Research Tasks Table
CREATE TABLE IF NOT EXISTS research_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type VARCHAR(100) NOT NULL,
  target_entity_type VARCHAR(50) NOT NULL,
  target_entity_id UUID,
  target_entity_name VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'HIGH',
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 10. CRM Leads Table
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_lead_id VARCHAR(100),
  lead_name VARCHAR(255) NOT NULL,
  pipeline_name VARCHAR(100),
  stage_name VARCHAR(100),
  stage_status VARCHAR(50),
  reported_address TEXT,
  reported_city VARCHAR(100),
  reported_state VARCHAR(2) DEFAULT 'CA',
  reported_zip VARCHAR(20),
  reported_property_type VARCHAR(100),
  reported_occupancy VARCHAR(50),
  reported_num_units INTEGER,
  reported_cost NUMERIC(14, 2),
  assigned_to VARCHAR(150),
  created_at_str VARCHAR(50),
  phones JSONB DEFAULT '[]'::jsonb,
  tracked_phone VARCHAR(50),
  email VARCHAR(150),
  next_task_kind VARCHAR(100),
  next_task_due_at VARCHAR(50),
  row_hash VARCHAR(64) NOT NULL,
  lead_identity_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Identity Matches Table
CREATE TABLE IF NOT EXISTS identity_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crm_lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  match_strategy VARCHAR(100) NOT NULL,
  match_score NUMERIC(5, 2) DEFAULT 0.00,
  match_status VARCHAR(30) NOT NULL DEFAULT 'VERIFIED_MATCH',
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Saved Properties Table
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  note TEXT,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_properties_prop ON saved_properties(property_id);
