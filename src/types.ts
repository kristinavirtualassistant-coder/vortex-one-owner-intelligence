/**
 * Vortex One Owner Intelligence & Property Search Data Schemas
 */

export type SourceCategory =
  | 'COUNTY_ASSESSOR'
  | 'COUNTY_GIS'
  | 'RECORDER'
  | 'STATE_BUSINESS_REGISTRY'
  | 'CENSUS'
  | 'CRM_LEADS'
  | 'FIRST_PARTY_WEBSITE';

export type ProvenanceClassification = 'FACT' | 'INFERENCE' | 'UNVERIFIED' | 'CONFLICT';

export type VerificationStatus = 'VERIFIED' | 'PROBABLE' | 'UNVERIFIED' | 'INVALID' | 'CONFLICT';

export type OwnerType = 'INDIVIDUAL' | 'CORPORATE_ENTITY' | 'TRUST';

export type MatchStrategy =
  | 'EXACT_APN'
  | 'NORMALIZED_ADDRESS_EXACT'
  | 'ADDRESS_AND_NAME_CORROBORATED'
  | 'PROBABLE_FUZZY';

export type MatchStatus = 'VERIFIED_MATCH' | 'PROBABLE_MATCH' | 'CONFLICT' | 'REJECTED';

export interface PropertyRecord {
  id: string;
  propertyKey: string;
  formattedAddress: string;
  streetNumber: string;
  streetName: string;
  unit: string;
  city: string;
  state: string;
  zipCode: string;
  censusTract?: string;
  latitude: number | null;
  longitude: number | null;
  geometry?: any;
  sourceName: string;
  sourceJurisdiction: string;
  sourceUrl: string;
  retrievedAt: string;
  updatedAt?: string;
  saved?: boolean;
  savedNote?: string;
  savedAt?: string;
}

export interface ParcelData {
  id: string;
  apn: string;
  canonicalApn: string;
  rawApn: string;
  apnFormat: 'OC_8_DIGIT' | 'OC_9_DIGIT' | 'OC_10_DIGIT' | 'CUSTOM' | 'UNKNOWN';
  propertyId: string;
  fipsCountyCode: string;
  landAssessedValue: number;
  improvementAssessedValue: number;
  totalAssessedValue: number;
  useCode: string;
  yearBuilt: number;
  units: number;
  bedrooms?: number;
  taxRateArea?: string;
  rollYear: number;
}

export interface OwnerRecord {
  id: string;
  fullName: string;
  normalizedName: string;
  ownerType: OwnerType;
  mailingAddress: string;
  isOwnerOccupied: boolean;
  corporateOfficer?: string;
  officerTitle?: string;
  registeredAgent?: string;
  businessAddress?: string;
  sosFileNumber?: string;
  sosStatus?: string;
}

export interface ContactRecord {
  id: string;
  entityId?: string;
  personId?: string;
  contactValue: string;
  contactType: 'PHONE' | 'MOBILE' | 'LANDLINE' | 'EMAIL' | 'WEBSITE';
  isTrackedLine?: boolean;
  sourceId: string;
  sourceUrl?: string;
  verificationStatus: VerificationStatus;
  confidence: number;
  evidenceHash: string;
  discoveredAt: string;
}

export interface ProvenanceLog {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  sourceId: string;
  rawPayloadId?: string;
  classification: ProvenanceClassification;
  confidence: number;
  valueRecorded: string;
  provenanceHash: string;
  recordedAt: string;
}

export interface ResearchTask {
  id: string;
  taskType: 'CONTACT_DISCOVERY_REQUIRED' | 'ENTITY_RESOLUTION_REQUIRED' | 'OWNER_VERIFICATION_REQUIRED';
  targetEntityType: string;
  targetEntityId: string;
  targetEntityName: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
}

export interface PortfolioRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerType: OwnerType;
  totalProperties: number;
  totalAssessedValue: number;
  totalUnits: number;
  distinctCities: number;
  absenteeProperties: number;
  ownerOccupiedProperties: number;
  absenteeRatio: number;
  isAbsenteePortfolio: boolean;
  leadScore: number;
  calculatedAt: string;
  properties?: {
    apn: string;
    address: string;
    city: string;
    assessedValue: number;
    units: number;
    useCode: string;
    isOwnerOccupied: boolean;
  }[];
}

export interface CRMLead {
  id: string;
  rawLeadId?: string;
  leadName: string;
  pipelineName?: string;
  stageName?: string;
  stageStatus?: string;
  reportedAddress: string;
  reportedCity: string;
  reportedState: string;
  reportedZip: string;
  reportedPropertyType?: string;
  reportedOccupancy?: string;
  reportedNumUnits?: number;
  reportedCost?: number;
  assignedTo?: string;
  createdAtStr?: string;
  phones: string[];
  trackedPhone?: string;
  email?: string;
  nextTaskKind?: string;
  nextTaskDueAt?: string;
  rowHash: string;
  leadIdentityHash: string;
}

export interface IdentityMatch {
  id: string;
  crmLeadId: string;
  ownerId: string;
  propertyId: string;
  matchStrategy: MatchStrategy;
  matchScore: number;
  matchStatus: MatchStatus;
  matchedAt: string;
}

export interface SearchResultPayload {
  property: PropertyRecord;
  parcel: ParcelData;
  owner: OwnerRecord;
  contacts: ContactRecord[];
  provenance: ProvenanceLog[];
  portfolio?: PortfolioRecord;
  matches?: IdentityMatch[];
  researchTasks?: ResearchTask[];
}

export interface BatchProcessingProgress {
  total: number;
  processed: number;
  successful: number;
  skipped: number;
  currentAddress?: string;
  logs: string[];
  status: 'idle' | 'running' | 'completed' | 'failed';
}
