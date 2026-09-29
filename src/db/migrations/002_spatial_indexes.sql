-- Vortex One Incremental Migration 002: Spatial Indexes & Spatial Queries
-- Supports PostGIS Bounding-Box (ST_MakeEnvelope) and Radius (ST_DWithin) Queries

-- Ensure PostGIS spatial index on properties geom column
CREATE INDEX IF NOT EXISTS idx_properties_geom_gist ON properties USING GIST (geom);

-- Additional b-tree indexes for fast coordinate range lookups when geometry is converted or fallback
CREATE INDEX IF NOT EXISTS idx_properties_lat_lng ON properties (latitude, longitude);

-- Additional index on parcels for fast spatial join lookups
CREATE INDEX IF NOT EXISTS idx_parcels_property_spatial ON parcels (property_id, total_assessed_value);
