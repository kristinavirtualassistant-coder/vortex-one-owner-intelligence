import { BaseCountySourceAdapter } from './baseAdapter.js';
import { SourceCategory, SourceStatus, FieldMapping } from './types.js';

export class LosAngelesCountyAdapter extends BaseCountySourceAdapter {
  countyName = 'Los Angeles';
  countyCode = '037';
  fipsCode = '06037';
  category: SourceCategory = 'COUNTY_GIS';
  agencyName = 'Los Angeles County Office of the Assessor / GIS Portal';
  endpointUrl = 'https://portal.gis.lacounty.gov/arcgis/rest/services/Public/LACounty_Parcels/MapServer/0';
  defaultStatus: SourceStatus = 'PROBABLE';
  defaultRecordCount = 2390000;

  fieldMapping: FieldMapping = {
    apnField: 'AIN',
    addressField: 'SitusAddress',
    cityField: 'SitusCity',
    zipField: 'SitusZIP',
    ownerField: 'OwnerName',
    useCodeField: 'UseCode',
    landValueField: 'Roll_LandValue',
    impValueField: 'Roll_ImpValue',
    totalValueField: 'Roll_TotalValue',
    yearBuiltField: 'YearBuilt',
    unitsField: 'Units',
  };
}
