import { query } from '../db/client.js';
import { ParcelData } from '../types';

export const parcelRepository = {
  async findByPropertyId(propertyId: string): Promise<ParcelData | null> {
    const res = await query(
      `SELECT * FROM parcels WHERE property_id = $1 LIMIT 1`,
      [propertyId]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      apn: row.apn,
      canonicalApn: row.canonical_apn,
      rawApn: row.raw_apn,
      apnFormat: row.apn_format as any,
      propertyId: row.property_id,
      fipsCountyCode: row.fips_county_code,
      landAssessedValue: Number(row.land_assessed_value),
      improvementAssessedValue: Number(row.improvement_assessed_value),
      totalAssessedValue: Number(row.total_assessed_value),
      useCode: row.use_code,
      yearBuilt: row.year_built,
      units: row.units,
      bedrooms: row.bedrooms,
      taxRateArea: row.tax_rate_area,
      rollYear: row.roll_year,
    };
  }
};
