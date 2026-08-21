import { query } from '../db/client.js';

export const sourceRepository = {
  async getAllCountiesWithSources() {
    const res = await query(
      `SELECT c.id as county_id, c.state_code, c.county_code, c.fips_code, c.county_name, c.state_name, c.is_active,
              sr.id as source_id, sr.source_category, sr.source_name, sr.agency_name, sr.endpoint_url,
              sr.status, sr.schema_status, sr.last_verified_at, sr.last_success_at, sr.last_failure_at, sr.record_count
       FROM counties c
       LEFT JOIN source_registry sr ON c.id = sr.county_id
       ORDER BY c.county_name ASC`
    );
    return res.rows;
  }
};
