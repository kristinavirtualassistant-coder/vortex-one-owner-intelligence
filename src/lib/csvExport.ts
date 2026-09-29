import { SearchResultPayload } from '../types';

function escapeCsv(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportPropertyToCsv(payload: SearchResultPayload, customNote?: string): void {
  const { property, parcel, owner, contacts, portfolio } = payload;

  const phoneContacts = (contacts || [])
    .filter((c) => c.contactType === 'PHONE' || c.contactType === 'MOBILE' || c.contactType === 'LANDLINE')
    .map((c) => `${c.contactValue} (${c.verificationStatus})`)
    .join('; ');

  const emailContacts = (contacts || [])
    .filter((c) => c.contactType === 'EMAIL')
    .map((c) => `${c.contactValue} (${c.verificationStatus})`)
    .join('; ');

  const websiteContacts = (contacts || [])
    .filter((c) => c.contactType === 'WEBSITE')
    .map((c) => c.contactValue)
    .join('; ');

  const headers = [
    'Property Key',
    'Formatted Address',
    'Street Number',
    'Street Name',
    'Unit',
    'City',
    'State',
    'ZIP Code',
    'Canonical APN',
    'Raw APN',
    'APN Format',
    'FIPS County Code',
    'Jurisdiction',
    'Latitude',
    'Longitude',
    'Total Assessed Value',
    'Land Assessed Value',
    'Improvement Assessed Value',
    'Use Code',
    'Units',
    'Bedrooms',
    'Year Built',
    'Roll Year',
    'Tax Rate Area',
    'Owner Full Name',
    'Owner Type',
    'Owner Mailing Address',
    'Is Owner Occupied',
    'Corporate Officer',
    'Officer Title',
    'Registered Agent',
    'Secretary of State File Number',
    'SOS Entity Status',
    'Business Address',
    'Verified Phones',
    'Verified Emails',
    'Websites',
    'Portfolio Total Properties',
    'Portfolio Total Assessed Value',
    'Portfolio Lead Score',
    'Portfolio Absentee Ratio',
    'Custom Research Notes',
    'Source Name',
    'Source URL',
    'Retrieved At',
    'Exported At',
  ];

  const row = [
    property.propertyKey || '',
    property.formattedAddress || '',
    property.streetNumber || '',
    property.streetName || '',
    property.unit || '',
    property.city || '',
    property.state || '',
    property.zipCode || '',
    parcel.canonicalApn || '',
    parcel.rawApn || '',
    parcel.apnFormat || '',
    parcel.fipsCountyCode || '06059',
    property.sourceJurisdiction || 'Orange County',
    property.latitude !== null ? property.latitude : '',
    property.longitude !== null ? property.longitude : '',
    parcel.totalAssessedValue || 0,
    parcel.landAssessedValue || 0,
    parcel.improvementAssessedValue || 0,
    parcel.useCode || '',
    parcel.units || 1,
    parcel.bedrooms || '',
    parcel.yearBuilt || '',
    parcel.rollYear || '',
    parcel.taxRateArea || '',
    owner.fullName || '',
    owner.ownerType || '',
    owner.mailingAddress || '',
    owner.isOwnerOccupied ? 'YES' : 'NO (Absentee)',
    owner.corporateOfficer || '',
    owner.officerTitle || '',
    owner.registeredAgent || '',
    owner.sosFileNumber || '',
    owner.sosStatus || '',
    owner.businessAddress || '',
    phoneContacts,
    emailContacts,
    websiteContacts,
    portfolio?.totalProperties ?? 1,
    portfolio?.totalAssessedValue ?? parcel.totalAssessedValue,
    portfolio?.leadScore ?? 50,
    portfolio?.absenteeRatio !== undefined ? `${Math.round(portfolio.absenteeRatio * 100)}%` : '',
    customNote || property.savedNote || '',
    property.sourceName || 'Orange County Assessor',
    property.sourceUrl || '',
    property.retrievedAt || '',
    new Date().toISOString(),
  ];

  const csvContent = [
    headers.map(escapeCsv).join(','),
    row.map(escapeCsv).join(','),
  ].join('\r\n');

  // Trigger download via Blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const cleanApn = (parcel.canonicalApn || 'property').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanAddress = (property.formattedAddress || 'property')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(0, 30);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `vortex1_${cleanApn}_${cleanAddress}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
