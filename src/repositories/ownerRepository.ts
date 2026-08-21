import { query } from '../db/client.js';
import { OwnerRecord } from '../types';

export const ownerRepository = {
  async findByPropertyId(propertyId: string): Promise<OwnerRecord | null> {
    const res = await query(
      `SELECT o.* FROM owners o
       JOIN owner_property op ON o.id = op.owner_id
       WHERE op.property_id = $1 AND op.is_current = true
       LIMIT 1`,
      [propertyId]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    const isOwnerOcc = row.is_owner_occupied ?? false;
    return {
      id: row.id,
      fullName: row.full_name,
      normalizedName: row.normalized_name,
      ownerType: row.owner_type as any,
      mailingAddress: row.mailing_address || '',
      isOwnerOccupied: isOwnerOcc,
      corporateOfficer: row.corporate_officer,
      officerTitle: row.officer_title,
      registeredAgent: row.registered_agent,
      businessAddress: row.business_address,
      sosFileNumber: row.sos_file_number,
      sosStatus: row.sos_status,
    };
  },

  async findAllOwnersForPortfolio() {
    const res = await query(
      `SELECT o.id, o.full_name, o.owner_type, 
              COUNT(op.property_id) as total_properties,
              SUM(pa.total_assessed_value) as total_value,
              SUM(pa.units) as total_units
       FROM owners o
       JOIN owner_property op ON o.id = op.owner_id
       JOIN properties p ON op.property_id = p.id
       JOIN parcels pa ON p.id = pa.property_id
       GROUP BY o.id, o.full_name, o.owner_type`
    );
    return res.rows;
  }
};
