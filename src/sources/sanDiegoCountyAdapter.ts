import { BaseCountySourceAdapter } from './baseAdapter.js';
import { SourceCategory, SourceStatus, FieldMapping } from './types.js';

export class SanDiegoCountyAdapter extends BaseCountySourceAdapter {
  countyName = 'San Diego';
  countyCode = '073';
  fipsCode = '06073';
  category: SourceCategory = 'COUNTY_GIS';
  agencyName = 'San Diego County Assessor/Recorder/County Clerk & SanGIS';
  endpointUrl = 'https://gis-public.sandag.org/arcgis/rest/services/Parcels/MapServer/0';
  defaultStatus: SourceStatus = 'PROBABLE';
  defaultRecordCount = 1040000;

  fieldMapping: FieldMapping = {
    apnField: 'APN',
    addressField: 'ADDR',
    cityField: 'CITY',
    zipField: 'ZIP',
    ownerField: 'OWNER',
    useCodeField: 'LU_CODE',
    landValueField: 'ASSD_LAND',
    impValueField: 'ASSD_IMP',
    totalValueField: 'ASSD_TOTAL',
    yearBuiltField: 'YEAR_EFF',
    unitsField: 'RES_UNITS',
  };
}
