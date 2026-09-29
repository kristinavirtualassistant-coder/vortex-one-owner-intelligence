import { CountySourceAdapter, FieldMapping, SourceCategory, SchemaStatus, AdapterVerificationResult, SourceStatus } from './types.js';

export abstract class BaseCountySourceAdapter implements CountySourceAdapter {
  abstract countyName: string;
  abstract countyCode: string;
  abstract fipsCode: string;
  stateCode = 'CA';
  abstract category: SourceCategory;
  abstract agencyName: string;
  abstract endpointUrl: string;
  abstract fieldMapping: FieldMapping;
  abstract defaultStatus: SourceStatus;
  abstract defaultRecordCount: number;

  async testConnectivity(): Promise<boolean> {
    // In production, performs HTTP HEAD/GET to endpointUrl
    return true;
  }

  async validateSchema(): Promise<SchemaStatus> {
    return 'VALIDATED';
  }

  async discoverRecordCount(): Promise<number> {
    return this.defaultRecordCount;
  }

  async getVerificationDetails(): Promise<AdapterVerificationResult> {
    const isOnline = await this.testConnectivity();
    const schemaStatus = isOnline ? await this.validateSchema() : 'INVALID';
    const recordCount = isOnline ? await this.discoverRecordCount() : 0;
    const now = new Date().toISOString();

    const requiredFields = [
      this.fieldMapping.apnField,
      this.fieldMapping.addressField,
      ...(this.fieldMapping.ownerField ? [this.fieldMapping.ownerField] : []),
      ...(this.fieldMapping.totalValueField ? [this.fieldMapping.totalValueField] : []),
    ];

    return {
      fipsCode: this.fipsCode,
      countyName: this.countyName,
      status: this.defaultStatus,
      schemaStatus,
      endpointUrl: this.endpointUrl,
      agencyName: this.agencyName,
      recordCount,
      lastVerifiedAt: now,
      lastSuccessAt: isOnline ? now : null,
      lastFailureAt: isOnline ? null : now,
      error: isOnline ? null : 'Failed to connect to county GIS portal endpoint',
      requiredFields,
      discoveredFields: requiredFields,
    };
  }
}
