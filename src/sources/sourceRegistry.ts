import { CountySourceAdapter } from './types.js';
import { OrangeCountyAdapter } from './orangeCountyAdapter.js';
import { LosAngelesCountyAdapter } from './losAngelesCountyAdapter.js';
import { SanDiegoCountyAdapter } from './sanDiegoCountyAdapter.js';
import { RiversideCountyAdapter } from './riversideCountyAdapter.js';

export const ALL_58_CA_COUNTIES = [
  { code: '001', fips: '06001', name: 'Alameda' },
  { code: '003', fips: '06003', name: 'Alpine' },
  { code: '005', fips: '06005', name: 'Amador' },
  { code: '007', fips: '06007', name: 'Butte' },
  { code: '009', fips: '06009', name: 'Calaveras' },
  { code: '011', fips: '06011', name: 'Colusa' },
  { code: '013', fips: '06013', name: 'Contra Costa' },
  { code: '015', fips: '06015', name: 'Del Norte' },
  { code: '017', fips: '06017', name: 'El Dorado' },
  { code: '019', fips: '06019', name: 'Fresno' },
  { code: '021', fips: '06021', name: 'Glenn' },
  { code: '023', fips: '06023', name: 'Humboldt' },
  { code: '025', fips: '06025', name: 'Imperial' },
  { code: '027', fips: '06027', name: 'Inyo' },
  { code: '029', fips: '06029', name: 'Kern' },
  { code: '031', fips: '06031', name: 'Kings' },
  { code: '033', fips: '06033', name: 'Lake' },
  { code: '035', fips: '06035', name: 'Lassen' },
  { code: '037', fips: '06037', name: 'Los Angeles' },
  { code: '039', fips: '06039', name: 'Madera' },
  { code: '041', fips: '06041', name: 'Marin' },
  { code: '043', fips: '06043', name: 'Mariposa' },
  { code: '045', fips: '06045', name: 'Mendocino' },
  { code: '047', fips: '06047', name: 'Merced' },
  { code: '049', fips: '06049', name: 'Modoc' },
  { code: '051', fips: '06051', name: 'Mono' },
  { code: '053', fips: '06053', name: 'Monterey' },
  { code: '055', fips: '06055', name: 'Napa' },
  { code: '057', fips: '06057', name: 'Nevada' },
  { code: '059', fips: '06059', name: 'Orange' },
  { code: '061', fips: '06061', name: 'Placer' },
  { code: '063', fips: '06063', name: 'Plumas' },
  { code: '065', fips: '06065', name: 'Riverside' },
  { code: '067', fips: '06067', name: 'Sacramento' },
  { code: '069', fips: '06069', name: 'San Benito' },
  { code: '071', fips: '06071', name: 'San Bernardino' },
  { code: '073', fips: '06073', name: 'San Diego' },
  { code: '075', fips: '06075', name: 'San Francisco' },
  { code: '077', fips: '06077', name: 'San Joaquin' },
  { code: '079', fips: '06079', name: 'San Luis Obispo' },
  { code: '081', fips: '06081', name: 'San Mateo' },
  { code: '083', fips: '06083', name: 'Santa Barbara' },
  { code: '085', fips: '06085', name: 'Santa Clara' },
  { code: '087', fips: '06087', name: 'Santa Cruz' },
  { code: '089', fips: '06089', name: 'Shasta' },
  { code: '091', fips: '06091', name: 'Sierra' },
  { code: '093', fips: '06093', name: 'Siskiyou' },
  { code: '095', fips: '06095', name: 'Solano' },
  { code: '097', fips: '06097', name: 'Sonoma' },
  { code: '099', fips: '06099', name: 'Stanislaus' },
  { code: '101', fips: '06101', name: 'Sutter' },
  { code: '103', fips: '06103', name: 'Tehama' },
  { code: '105', fips: '06105', name: 'Trinity' },
  { code: '107', fips: '06107', name: 'Tulare' },
  { code: '109', fips: '06109', name: 'Tuolumne' },
  { code: '111', fips: '06111', name: 'Ventura' },
  { code: '113', fips: '06113', name: 'Yolo' },
  { code: '115', fips: '06115', name: 'Yuba' },
];

export class SourceRegistry {
  private adapters: Map<string, CountySourceAdapter> = new Map();

  constructor() {
    this.registerAdapter(new OrangeCountyAdapter());
    this.registerAdapter(new LosAngelesCountyAdapter());
    this.registerAdapter(new SanDiegoCountyAdapter());
    this.registerAdapter(new RiversideCountyAdapter());
  }

  public registerAdapter(adapter: CountySourceAdapter): void {
    this.adapters.set(adapter.fipsCode, adapter);
  }

  public getAdapter(fipsCode: string): CountySourceAdapter | undefined {
    return this.adapters.get(fipsCode);
  }

  public getAllAdapters(): CountySourceAdapter[] {
    return Array.from(this.adapters.values());
  }

  public async getCompleteGisAudit(): Promise<any[]> {
    const auditPromises = ALL_58_CA_COUNTIES.map(async (c) => {
      const adapter = this.adapters.get(c.fips);
      if (adapter) {
        const details = await adapter.getVerificationDetails();
        return {
          county: c.name,
          state: 'CA',
          fipsCode: c.fips,
          sourceConfigured: true,
          status: details.status,
          schemaStatus: details.schemaStatus,
          endpointUrl: details.endpointUrl,
          agencyName: details.agencyName,
          recordCount: details.recordCount,
          lastVerifiedAt: details.lastVerifiedAt,
          lastSuccessAt: details.lastSuccessAt,
          lastFailureAt: details.lastFailureAt,
          error: details.error || null,
          requiredFields: details.requiredFields,
          discoveredFields: details.discoveredFields,
          sources: [
            {
              sourceId: `s-${c.code}-gis`,
              category: adapter.category,
              sourceName: `${c.name} County GIS Portal`,
              agencyName: adapter.agencyName,
              endpointUrl: adapter.endpointUrl,
              status: details.status,
              schemaStatus: details.schemaStatus,
              recordCount: details.recordCount,
              lastVerifiedAt: details.lastVerifiedAt,
              lastSuccessAt: details.lastSuccessAt,
              lastFailureAt: details.lastFailureAt,
            }
          ]
        };
      }

      // Unconfigured counties are strictly NOT_CONFIGURED
      return {
        county: c.name,
        state: 'CA',
        fipsCode: c.fips,
        sourceConfigured: false,
        status: 'NOT_CONFIGURED',
        schemaStatus: 'PENDING',
        endpointUrl: null,
        agencyName: `${c.name} County Assessor / GIS`,
        recordCount: 0,
        lastVerifiedAt: null,
        lastSuccessAt: null,
        lastFailureAt: null,
        error: null,
        requiredFields: ['APN', 'ADDRESS'],
        discoveredFields: [],
        sources: []
      };
    });

    return Promise.all(auditPromises);
  }
}

export const sourceRegistry = new SourceRegistry();
