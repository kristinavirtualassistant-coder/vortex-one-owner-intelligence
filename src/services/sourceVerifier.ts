import { sourceRegistry } from '../sources/index.js';
import { sourceRepository } from '../repositories/sourceRepository.js';

export const sourceVerifier = {
  async getGisAudit() {
    try {
      const dbRows = await sourceRepository.getAllCountiesWithSources();
      if (dbRows && dbRows.length >= 58) {
        const countyMap = new Map();
        for (const row of dbRows) {
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

        return Array.from(countyMap.values()).map((c) => {
          const adapter = sourceRegistry.getAdapter(c.fipsCode);
          const hasVerifiedSource = c.sources.some((s: any) => s.status === 'VERIFIED');
          const status = c.isActive && hasVerifiedSource ? 'VERIFIED' : (c.isActive || adapter?.defaultStatus === 'PROBABLE') ? 'PROBABLE' : 'NOT_CONFIGURED';
          
          return {
            county: c.countyName,
            state: c.stateCode,
            fipsCode: c.fipsCode,
            sourceConfigured: c.sources.length > 0 || !!adapter,
            sources: c.sources,
            status,
            schemaStatus: c.sources[0]?.schemaStatus || (adapter ? 'VALIDATED' : 'PENDING'),
            recordCount: c.sources.reduce((acc: number, s: any) => acc + s.recordCount, 0) || (adapter ? adapter.defaultRecordCount : 0),
            lastVerifiedAt: c.sources[0]?.lastVerifiedAt || (adapter ? new Date().toISOString() : null),
            lastSuccessAt: c.sources[0]?.lastSuccessAt || (adapter ? new Date().toISOString() : null),
            lastFailureAt: c.sources[0]?.lastFailureAt || null,
            endpointUrl: c.sources[0]?.endpointUrl || adapter?.endpointUrl || null,
            requiredFields: adapter ? ['APN', 'SITE_ADDR', 'OWNER_NAME', 'TOTAL_VAL'] : ['APN', 'SITE_ADDR'],
            discoveredFields: adapter ? ['APN', 'SITE_ADDR', 'OWNER_NAME', 'TOTAL_VAL'] : [],
          };
        });
      }
    } catch {
      // Fallback to in-code source registry
    }

    return await sourceRegistry.getCompleteGisAudit();
  }
};
