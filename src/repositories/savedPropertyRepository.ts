import { query } from '../db/client.js';

export const savedPropertyRepository = {
  async getAll() {
    const res = await query(
      `SELECT sp.*, p.*, s.source_name, s.endpoint_url as source_url
       FROM saved_properties sp
       JOIN properties p ON sp.property_id = p.id
       LEFT JOIN source_registry s ON p.source_id = s.id
       ORDER BY sp.saved_at DESC`
    );
    return res.rows;
  },

  async save(propertyId: string, note: string) {
    const res = await query(
      `INSERT INTO saved_properties (property_id, note, saved_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (property_id) DO UPDATE SET note = EXCLUDED.note, saved_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [propertyId, note]
    );
    return res.rows[0];
  },

  async remove(propertyKey: string) {
    const cleanKey = propertyKey.replace(/^oc:/, '');
    const res = await query(
      `DELETE FROM saved_properties WHERE property_id IN (
         SELECT id FROM properties WHERE property_key = $1 OR property_key = $2 OR id IN (
           SELECT property_id FROM parcels WHERE apn = $3 OR canonical_apn = $3
         )
       )`,
      [propertyKey, `oc:${cleanKey}`, cleanKey]
    );
    return (res.rowCount || 0) > 0;
  }
};
