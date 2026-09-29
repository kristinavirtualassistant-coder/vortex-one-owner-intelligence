/**
 * Vortex One Streaming GIS Importer Types
 */

export interface RawGisFeature {
  type?: string;
  properties?: {
    apn?: string;
    APN?: string;
    PARCEL_ID?: string;
    parcel_id?: string;
    address?: string;
    ADDRESS?: string;
    SITE_ADDR?: string;
    street_number?: string;
    street_name?: string;
    unit?: string;
    city?: string;
    CITY?: string;
    state?: string;
    zip?: string;
    ZIP?: string;
    owner?: string;
    OWNER_NAME?: string;
    mailing_address?: string;
    land_value?: number | string;
    imp_value?: number | string;
    total_value?: number | string;
    use_code?: string;
    year_built?: number | string;
    units?: number | string;
    bedrooms?: number | string;
    census_tract?: string;
    [key: string]: any;
  };
  geometry?: {
    type: string;
    coordinates: any;
  };
}

export interface ImportOptions {
  sourceId: string;
  countyId: string;
  fipsCode: string;
  sourceJurisdiction: string;
  batchSize?: number; // default 1000
  strictMode?: boolean; // abort on first error if true, default false
  checkpointResumeIndex?: number; // skip items before this index
  onProgress?: (stats: ImportStats) => void;
}

export interface ImportErrorRecord {
  recordIndex: number;
  rawApn?: string;
  rawAddress?: string;
  error: string;
  timestamp: string;
}

export interface ImportStats {
  totalProcessed: number;
  totalInserted: number;
  totalFailed: number;
  totalSkipped: number;
  batchesCount: number;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  errors: ImportErrorRecord[];
  lastProcessedCheckpoint: number;
}
