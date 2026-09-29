import { BaseCountySourceAdapter } from './baseAdapter.js';
import { SourceCategory, SourceStatus, FieldMapping } from './types.js';

export class RiversideCountyAdapter extends BaseCountySourceAdapter {
  countyName = 'Riverside';
  countyCode = '065';
  fipsCode = '06065';
  category: SourceCategory = 'COUNTY_GIS';
  agencyName = 'Riverside County Assessor-County Clerk-Recorder & RCIT';
  endpointUrl = 'https://gis.countyofriverside.us/arcgis/rest/services/Public/Parcels/MapServer/0';
  defaultStatus: SourceStatus = 'PROBABLE';
  defaultRecordCount = 920000;

  fieldMapping: FieldMapping = {
    apnField: 'APN_9_DIGIT',
    addressField: 'PROP_ADDRESS',
    cityField: 'PROP_CITY',
    zipField: 'PROP_ZIP',
    ownerField: 'OWNER_NAME',
    useCodeField: 'USE_CODE',
    landValueField: 'LAND_VALUE',
    impValueField: 'IMP_VALUE',
    totalValueField: 'NET_VALUE',
    yearBuiltField: 'YEAR_BUILT',
    unitsField: 'UNIT_COUNT',
  };
}
