import { BaseCountySourceAdapter } from './baseAdapter.js';
import { SourceCategory, SourceStatus, FieldMapping } from './types.js';

export class OrangeCountyAdapter extends BaseCountySourceAdapter {
  countyName = 'Orange';
  countyCode = '059';
  fipsCode = '06059';
  category: SourceCategory = 'COUNTY_GIS';
  agencyName = 'Orange County IT / GIS & Assessor';
  endpointUrl = 'https://gis.ocgov.com/arcgis/rest/services/Public/OC_Parcels/MapServer/0';
  defaultStatus: SourceStatus = 'VERIFIED';
  defaultRecordCount = 850000;

  fieldMapping: FieldMapping = {
    apnField: 'APN_8_DIGIT',
    addressField: 'SITE_ADDR',
    cityField: 'CITY',
    zipField: 'ZIP',
    ownerField: 'OWNER_NAME',
    useCodeField: 'USE_CODE',
    landValueField: 'LAND_VAL',
    impValueField: 'IMP_VAL',
    totalValueField: 'TOTAL_VAL',
    yearBuiltField: 'YEAR_BUILT',
    unitsField: 'UNITS',
  };
}
