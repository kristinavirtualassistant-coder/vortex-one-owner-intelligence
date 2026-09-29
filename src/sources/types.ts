/**
 * Vortex One County Source Adapter Types
 */

export type SourceStatus = 'VERIFIED' | 'PROBABLE' | 'NOT_CONFIGURED' | 'UNVERIFIED' | 'INVALID' | 'CONFLICT';
export type SchemaStatus = 'VALIDATED' | 'PENDING' | 'INVALID' | 'MISMATCH';
export type SourceCategory = 'COUNTY_GIS' | 'COUNTY_ASSESSOR' | 'RECORDER' | 'TAX_COLLECTOR' | 'STATE_SOS';

export interface FieldMapping {
  apnField: string;
  addressField: string;
  cityField?: string;
  zipField?: string;
  ownerField?: string;
  useCodeField?: string;
  landValueField?: string;
  impValueField?: string;
  totalValueField?: string;
  yearBuiltField?: string;
  unitsField?: string;
}

export interface AdapterVerificationResult {
  fipsCode: string;
  countyName: string;
  status: SourceStatus;
  schemaStatus: SchemaStatus;
  endpointUrl: string;
  agencyName: string;
  recordCount: number;
  lastVerifiedAt: string;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  error?: string | null;
  requiredFields: string[];
  discoveredFields: string[];
}

export interface CountySourceAdapter {
  countyName: string;
  countyCode: string;
  fipsCode: string;
  stateCode: string;
  category: SourceCategory;
  agencyName: string;
  endpointUrl: string;
  fieldMapping: FieldMapping;
  defaultStatus: SourceStatus;
  defaultRecordCount: number;
  
  testConnectivity(): Promise<boolean>;
  validateSchema(): Promise<SchemaStatus>;
  discoverRecordCount(): Promise<number>;
  getVerificationDetails(): Promise<AdapterVerificationResult>;
}
