import { query } from '../db/client.js';
import { PropertyRecord } from '../types';

export const propertyRepository = {
  async findByQuery(q: string): Promise<PropertyRecord[]> {
    const cleanQ = q.toUpperCase().trim();
    const res = await query(
      `SELECT p.*, s.source_name, s.endpoint_url as source_url, sp.note as saved_note, sp.saved_at
       FROM properties p
       LEFT JOIN source_registry s ON p.source_id = s.id
       LEFT JOIN saved_properties sp ON p.id = sp.property_id
       WHERE UPPER(p.formatted_address) LIKE $1
          OR UPPER(p.city) LIKE $1
          OR UPPER(p.property_key) LIKE $1
          OR p.id IN (
            SELECT property_id FROM parcels WHERE apn LIKE $1 OR canonical_apn LIKE $1
          )
          OR p.id IN (
            SELECT property_id FROM owner_property op
            JOIN owners o ON op.owner_id = o.id
            WHERE UPPER(o.full_name) LIKE $1 OR UPPER(o.normalized_name) LIKE $1
          )
       LIMIT 20`,
      [`%${cleanQ}%`]
    );

    return res.rows.map((row) => ({
      id: row.id,
      propertyKey: row.property_key,
      formattedAddress: row.formatted_address,
      streetNumber: row.street_number || '',
      streetName: row.street_name || '',
      unit: row.unit || '',
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      censusTract: row.census_tract,
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
      sourceName: row.source_name || 'Orange County Assessor & Public GIS',
      sourceJurisdiction: row.source_jurisdiction || 'Orange County, CA',
      sourceUrl: row.source_url || 'https://gis.ocgov.com/',
      retrievedAt: row.retrieved_at,
      saved: !!row.saved_at,
      savedNote: row.saved_note || '',
      savedAt: row.saved_at || undefined,
    }));
  },

  async findById(id: string): Promise<PropertyRecord | null> {
    const res = await query(
      `SELECT p.*, s.source_name, s.endpoint_url as source_url, sp.note as saved_note, sp.saved_at
       FROM properties p
       LEFT JOIN source_registry s ON p.source_id = s.id
       LEFT JOIN saved_properties sp ON p.id = sp.property_id
       WHERE p.id = $1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      propertyKey: row.property_key,
      formattedAddress: row.formatted_address,
      streetNumber: row.street_number || '',
      streetName: row.street_name || '',
      unit: row.unit || '',
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      censusTract: row.census_tract,
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
      sourceName: row.source_name || 'Orange County Assessor & Public GIS',
      sourceJurisdiction: row.source_jurisdiction || 'Orange County, CA',
      sourceUrl: row.source_url || 'https://gis.ocgov.com/',
      retrievedAt: row.retrieved_at,
      saved: !!row.saved_at,
      savedNote: row.saved_note || '',
      savedAt: row.saved_at || undefined,
    };
  },

  async bulkSearch(filters: { city?: string; useCode?: string; minVal?: number; maxVal?: number; sortBy?: string; limit?: number; offset?: number }) {
    const city = filters.city ? filters.city.toUpperCase().trim() : '';
    const useCode = filters.useCode ? filters.useCode.toUpperCase().trim() : '';
    const minVal = filters.minVal ?? 0;
    const maxVal = filters.maxVal ?? 999999999;
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    const sortBy = filters.sortBy || 'value_desc';

    let orderClause = 'pa.total_assessed_value DESC';
    if (sortBy === 'value_asc') orderClause = 'pa.total_assessed_value ASC';
    else if (sortBy === 'units_desc') orderClause = 'pa.units DESC';
    else if (sortBy === 'newest') orderClause = 'pa.year_built DESC';

    const res = await query(
      `SELECT p.*, pa.apn, pa.canonical_apn, pa.raw_apn, pa.land_assessed_value, pa.improvement_assessed_value,
              pa.total_assessed_value, pa.use_code, pa.year_built, pa.units, pa.bedrooms,
              o.id as owner_id, o.full_name as owner_name, o.mailing_address, o.owner_type,
              sp.saved_at, sp.note as saved_note
       FROM properties p
       JOIN parcels pa ON p.id = pa.property_id
       LEFT JOIN owner_property op ON p.id = op.property_id AND op.is_current = true
       LEFT JOIN owners o ON op.owner_id = o.id
       LEFT JOIN saved_properties sp ON p.id = sp.property_id
       WHERE ($1 = '' OR UPPER(p.city) = $1)
         AND ($2 = '' OR UPPER(pa.use_code) LIKE $2)
         AND pa.total_assessed_value >= $3
         AND pa.total_assessed_value <= $4
       ORDER BY ${orderClause}
       LIMIT $5 OFFSET $6`,
      [city === 'ALL' ? '' : city, useCode === 'ALL' ? '' : `%${useCode}%`, minVal, maxVal, limit, offset]
    );

    return res.rows;
  },

  async getAutocompleteSuggestions(q: string) {
    const cleanQ = q.toUpperCase().trim();
    const res = await query(
      `SELECT p.formatted_address, p.city, pa.apn, o.full_name as owner_name
       FROM properties p
       JOIN parcels pa ON p.id = pa.property_id
       LEFT JOIN owner_property op ON p.id = op.property_id AND op.is_current = true
       LEFT JOIN owners o ON op.owner_id = o.id
       WHERE UPPER(p.formatted_address) LIKE $1
          OR UPPER(pa.apn) LIKE $1
          OR UPPER(o.full_name) LIKE $1
          OR UPPER(p.city) LIKE $1
       LIMIT 8`,
      [`%${cleanQ}%`]
    );
    return res.rows;
  }
};
