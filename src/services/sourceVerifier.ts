import { sourceRepository } from '../repositories/sourceRepository.js';

export const sourceVerifier = {
  async getGisAudit() {
    const rows = await sourceRepository.getAllCountiesWithSources();
    
    // Group by county
    const countyMap = new Map();
    for (const row of rows) {
      if (!countyMap.has(row.fips_code)) {
        countyMap.set(row.fips_code, {
          fipsCode: row.fips_code,
          countyCode: row.county_code,
          countyName: row.county_name,
          stateCode: row.state_code,
          stateName: row.state_name,
          isActive: row.is_active,
          sources: [],
        });
      }
      if (row.source_id) {
        countyMap.get(row.fips_code).sources.push({
          sourceId: row.source_id,
          category: row.source_category,
          sourceName: row.source_name,
          agencyName: row.agency_name,
          endpointUrl: row.endpoint_url,
          status: row.status,
          schemaStatus: row.schema_status,
          lastVerifiedAt: row.last_verified_at,
          lastSuccessAt: row.last_success_at,
          lastFailureAt: row.last_failure_at,
          recordCount: Number(row.record_count || 0),
        });
      }
    }

    const auditRecords = Array.from(countyMap.values()).map((c) => {
      const hasVerifiedSource = c.sources.some((s: any) => s.status === 'VERIFIED');
      return {
        county: c.countyName,
        state: c.stateCode,
        fipsCode: c.fipsCode,
        sourceConfigured: c.sources.length > 0,
        sources: c.sources,
        status: c.isActive && hasVerifiedSource ? 'VERIFIED' : c.isActive ? 'PROBABLE' : 'NOT_CONFIGURED',
        schemaStatus: c.sources[0]?.schemaStatus || 'PENDING',
        recordCount: c.sources.reduce((acc: number, s: any) => acc + s.recordCount, 0),
        lastVerifiedAt: c.sources[0]?.lastVerifiedAt || null,
        lastSuccessAt: c.sources[0]?.lastSuccessAt || null,
        lastFailureAt: c.sources[0]?.lastFailureAt || null,
        endpointUrl: c.sources[0]?.endpointUrl || null,
      };
    });

    return auditRecords;
  }
};
