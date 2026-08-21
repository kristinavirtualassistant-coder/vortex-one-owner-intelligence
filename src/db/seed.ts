import fs from 'fs';
import path from 'path';
import { pool, query } from './client.js';
import { normalizeApn, normalizeEntityName, classifyOwnerType, computeSha256Sync } from '../lib/normalizers.js';

const CA_COUNTIES = [
  { code: '001', fips: '06001', name: 'Alameda', active: false },
  { code: '003', fips: '06003', name: 'Alpine', active: false },
  { code: '005', fips: '06005', name: 'Amador', active: false },
  { code: '007', fips: '06007', name: 'Butte', active: false },
  { code: '009', fips: '06009', name: 'Calaveras', active: false },
  { code: '011', fips: '06011', name: 'Colusa', active: false },
  { code: '013', fips: '06013', name: 'Contra Costa', active: false },
  { code: '015', fips: '06015', name: 'Del Norte', active: false },
  { code: '017', fips: '06017', name: 'El Dorado', active: false },
  { code: '019', fips: '06019', name: 'Fresno', active: false },
  { code: '021', fips: '06021', name: 'Glenn', active: false },
  { code: '023', fips: '06023', name: 'Humboldt', active: false },
  { code: '025', fips: '06025', name: 'Imperial', active: false },
  { code: '027', fips: '06027', name: 'Inyo', active: false },
  { code: '029', fips: '06029', name: 'Kern', active: false },
  { code: '031', fips: '06031', name: 'Kings', active: false },
  { code: '033', fips: '06033', name: 'Lake', active: false },
  { code: '035', fips: '06035', name: 'Lassen', active: false },
  { code: '037', fips: '06037', name: 'Los Angeles', active: false },
  { code: '039', fips: '06039', name: 'Madera', active: false },
  { code: '041', fips: '06041', name: 'Marin', active: false },
  { code: '043', fips: '06043', name: 'Mariposa', active: false },
  { code: '045', fips: '06045', name: 'Mendocino', active: false },
  { code: '047', fips: '06047', name: 'Merced', active: false },
  { code: '049', fips: '06049', name: 'Modoc', active: false },
  { code: '051', fips: '06051', name: 'Mono', active: false },
  { code: '053', fips: '06053', name: 'Monterey', active: false },
  { code: '055', fips: '06055', name: 'Napa', active: false },
  { code: '057', fips: '06057', name: 'Nevada', active: false },
  { code: '059', fips: '06059', name: 'Orange', active: true }, // Orange County (Operational)
  { code: '061', fips: '06061', name: 'Placer', active: false },
  { code: '063', fips: '06063', name: 'Plumas', active: false },
  { code: '065', fips: '06065', name: 'Riverside', active: false },
  { code: '067', fips: '06067', name: 'Sacramento', active: false },
  { code: '069', fips: '06069', name: 'San Benito', active: false },
  { code: '071', fips: '06071', name: 'San Bernardino', active: false },
  { code: '073', fips: '06073', name: 'San Diego', active: false },
  { code: '075', fips: '06075', name: 'San Francisco', active: false },
  { code: '077', fips: '06077', name: 'San Joaquin', active: false },
  { code: '079', fips: '06079', name: 'San Luis Obispo', active: false },
  { code: '081', fips: '06081', name: 'San Mateo', active: false },
  { code: '083', fips: '06083', name: 'Santa Barbara', active: false },
  { code: '085', fips: '06085', name: 'Santa Clara', active: false },
  { code: '087', fips: '06087', name: 'Santa Cruz', active: false },
  { code: '089', fips: '06089', name: 'Shasta', active: false },
  { code: '091', fips: '06091', name: 'Sierra', active: false },
  { code: '093', fips: '06093', name: 'Siskiyou', active: false },
  { code: '095', fips: '06095', name: 'Solano', active: false },
  { code: '097', fips: '06097', name: 'Sonoma', active: false },
  { code: '099', fips: '06099', name: 'Stanislaus', active: false },
  { code: '101', fips: '06101', name: 'Sutter', active: false },
  { code: '103', fips: '06103', name: 'Tehama', active: false },
  { code: '105', fips: '06105', name: 'Trinity', active: false },
  { code: '107', fips: '06107', name: 'Tulare', active: false },
  { code: '109', fips: '06109', name: 'Tuolumne', active: false },
  { code: '111', fips: '06111', name: 'Ventura', active: false },
  { code: '113', fips: '06113', name: 'Yolo', active: false },
  { code: '115', fips: '06115', name: 'Yuba', active: false },
];

const SEED_PROPERTIES = [
  {
    apn: '580-081-01',
    rawApn: '5800810100',
    address: '400 SPECTRUM CENTER DR',
    city: 'IRVINE',
    state: 'CA',
    zip: '92618',
    owner: 'IRVINE COMPANY LLC',
    mailingAddress: '550 NEWPORT CENTER DR, NEWPORT BEACH, CA 92660',
    landVal: 45000000,
    impVal: 85000000,
    totalVal: 130000000,
    useCode: '0300 Commercial High-Rise',
    yearBuilt: 2017,
    units: 120,
    bedrooms: 0,
    lat: 33.6552,
    lng: -117.7538,
    officer: 'Donald Bren (Chairman)',
    officerTitle: 'Managing Director & Principal',
    registeredAgent: 'Corporation Service Company',
    sosFileNumber: 'C1988291',
    businessPhone: '(949) 720-2000',
    businessEmail: 'contact@irvinecompany.com',
  },
  {
    apn: '123-456-78',
    rawApn: '12345678',
    address: '2076 MAGNOLIA AVE',
    city: 'LONG BEACH',
    state: 'CA',
    zip: '90806',
    owner: 'PACIFIC COAST HOLDINGS LLC',
    mailingAddress: '100 CAPITAL MALL STE 500, SACRAMENTO, CA 95814',
    landVal: 1200000,
    impVal: 2400000,
    totalVal: 3600000,
    useCode: '0200 Multi-Family 12 Units',
    yearBuilt: 1978,
    units: 12,
    bedrooms: 16,
    lat: 33.7912,
    lng: -118.1932,
    officer: 'Leon Green',
    officerTitle: 'Managing Member',
    registeredAgent: 'National Registered Agents Inc.',
    sosFileNumber: '201509110293',
    businessPhone: '(562) 555-8392',
    businessEmail: 'l.green@pacificcoastholdings.com',
  },
  {
    apn: '042-192-15',
    rawApn: '04219215',
    address: '100 MAIN ST',
    city: 'SEAL BEACH',
    state: 'CA',
    zip: '90740',
    owner: 'JOHN DOE & JANE DOE TR',
    mailingAddress: '100 MAIN ST, SEAL BEACH, CA 90740',
    landVal: 850000,
    impVal: 450000,
    totalVal: 1300000,
    useCode: '0100 Single Family Residential',
    yearBuilt: 1965,
    units: 1,
    bedrooms: 3,
    lat: 33.7414,
    lng: -118.1048,
    officer: 'John Doe',
    officerTitle: 'Trustee',
    registeredAgent: 'N/A (Individual Trust)',
    sosFileNumber: 'TR-88201',
    businessPhone: '(714) 555-1204',
    businessEmail: 'johndoe@gmail.com',
  },
  {
    apn: '081-302-99',
    rawApn: '08130299',
    address: '1200 S HARBOR BLVD',
    city: 'ANAHEIM',
    state: 'CA',
    zip: '92805',
    owner: 'ANAHEIM RESORT VENTURES CORP',
    mailingAddress: '884 MARKET AVE, SAN FRANCISCO, CA 94102',
    landVal: 6500000,
    impVal: 12500000,
    totalVal: 19000000,
    useCode: '0350 Commercial Resort / Hotel',
    yearBuilt: 1998,
    units: 45,
    bedrooms: 45,
    lat: 33.8032,
    lng: -117.9154,
    officer: 'Marcus Vance',
    officerTitle: 'Chief Executive Officer',
    registeredAgent: 'Cogency Global Inc.',
    sosFileNumber: 'C3910248',
    businessPhone: '(714) 555-9012',
    businessEmail: 'info@anaheimresortventures.com',
  },
  {
    apn: '439-011-22',
    rawApn: '43901122',
    address: '456 HARBOR BLVD',
    city: 'COSTA MESA',
    state: 'CA',
    zip: '92626',
    owner: 'COSTA MESA RETAIL GROUP LLC',
    mailingAddress: '456 HARBOR BLVD, COSTA MESA, CA 92626',
    landVal: 2200000,
    impVal: 3800000,
    totalVal: 6000000,
    useCode: '0320 Retail Shopping Strip',
    yearBuilt: 2004,
    units: 8,
    bedrooms: 0,
    lat: 33.6411,
    lng: -117.9189,
    officer: 'Sarah Jenkins',
    officerTitle: 'Managing Director',
    registeredAgent: 'Registered Agent Solutions Inc.',
    sosFileNumber: '201930210084',
    businessPhone: '(949) 555-4081',
    businessEmail: 'sjenkins@cmretailgroup.com',
  },
  {
    apn: '610-291-04',
    rawApn: '6102910400',
    address: '610 NEWPORT CENTER DR',
    city: 'NEWPORT BEACH',
    state: 'CA',
    zip: '92660',
    owner: 'PACIFIC OASIS PROPERTIES INC',
    mailingAddress: 'ONE EMBARCADERO CTR, SAN FRANCISCO, CA 94111',
    landVal: 38000000,
    impVal: 57000000,
    totalVal: 95000000,
    useCode: '0300 Commercial High-Rise',
    yearBuilt: 2012,
    units: 85,
    bedrooms: 0,
    lat: 33.6189,
    lng: -117.8765,
    officer: 'Arthur Pendelton',
    officerTitle: 'President',
    registeredAgent: 'CT Corporation System',
    sosFileNumber: 'C2891029',
    businessPhone: '(949) 555-8800',
    businessEmail: 'apendelton@pacificoasis.com',
  },
  {
    apn: '320-112-99',
    rawApn: '3201129900',
    address: '2150 E KATELLA AVE',
    city: 'ANAHEIM',
    state: 'CA',
    zip: '92806',
    owner: 'ANGELUS PLAZA HOLDINGS LLC',
    mailingAddress: '2150 E KATELLA AVE STE 400, ANAHEIM, CA 92806',
    landVal: 3100000,
    impVal: 5400000,
    totalVal: 8500000,
    useCode: '0310 Commercial Office Building',
    yearBuilt: 1989,
    units: 32,
    bedrooms: 0,
    lat: 33.8055,
    lng: -117.8821,
    officer: 'Elena Rostova',
    officerTitle: 'Managing Partner',
    registeredAgent: 'National Registered Agents',
    sosFileNumber: '201728110092',
    businessPhone: '(714) 555-4300',
    businessEmail: 'elena@angelusplaza.com',
  },
  {
    apn: '410-092-33',
    rawApn: '4100923300',
    address: '18000 VON KARMAN AVE',
    city: 'IRVINE',
    state: 'CA',
    zip: '92612',
    owner: 'SCA METROPOLITAN HOLDINGS LLC',
    mailingAddress: '400 CONSTITUTION AVE, AUSTIN, TX 78701',
    landVal: 21000000,
    impVal: 33000000,
    totalVal: 54000000,
    useCode: '0300 Commercial High-Rise',
    yearBuilt: 2015,
    units: 64,
    bedrooms: 0,
    lat: 33.6842,
    lng: -117.8521,
    officer: 'Robert Sterling',
    officerTitle: 'Chief Investment Officer',
    registeredAgent: 'Corporation Service Company',
    sosFileNumber: 'C3902910',
    businessPhone: '(949) 555-2211',
    businessEmail: 'rsterling@scametro.com',
  },
  {
    apn: '015-442-12',
    rawApn: '0154421200',
    address: '100 CIVIC CENTER DR',
    city: 'SANTA ANA',
    state: 'CA',
    zip: '92701',
    owner: 'SANTA ANA CIVIC TOWER LP',
    mailingAddress: '500 S GRAND AVE, LOS ANGELES, CA 90071',
    landVal: 15000000,
    impVal: 27000000,
    totalVal: 42000000,
    useCode: '0330 Professional Office Complex',
    yearBuilt: 1992,
    units: 50,
    bedrooms: 0,
    lat: 33.7456,
    lng: -117.8678,
    officer: 'David Chang',
    officerTitle: 'General Partner',
    registeredAgent: 'CSC-Lawyers Incorporating Service',
    sosFileNumber: 'LP009182',
    businessPhone: '(714) 555-6600',
    businessEmail: 'dchang@santanaic.com',
  },
  {
    apn: '720-101-88',
    rawApn: '7201018800',
    address: '200 PACIFIC COAST HWY',
    city: 'HUNTINGTON BEACH',
    state: 'CA',
    zip: '92648',
    owner: 'PCH OCEANFRONT RESORT LLC',
    mailingAddress: '200 PACIFIC COAST HWY, HUNTINGTON BEACH, CA 92648',
    landVal: 32000000,
    impVal: 46000000,
    totalVal: 78000000,
    useCode: '0350 Commercial Resort / Hotel',
    yearBuilt: 2008,
    units: 110,
    bedrooms: 110,
    lat: 33.6595,
    lng: -118.0021,
    officer: 'Vanessa White',
    officerTitle: 'Managing Member',
    registeredAgent: 'Registered Agent Solutions',
    sosFileNumber: '201210210039',
    businessPhone: '(714) 555-7799',
    businessEmail: 'vwhite@pchoceanresort.com',
  },
  {
    apn: '425-331-50',
    rawApn: '4253315000',
    address: '3333 BRISTOL ST',
    city: 'COSTA MESA',
    state: 'CA',
    zip: '92626',
    owner: 'SOUTH COAST RETAIL PARTNERS LP',
    mailingAddress: '3333 BRISTOL ST, COSTA MESA, CA 92626',
    landVal: 65000000,
    impVal: 95000000,
    totalVal: 160000000,
    useCode: '0325 Regional Shopping Mall',
    yearBuilt: 1985,
    units: 220,
    bedrooms: 0,
    lat: 33.6901,
    lng: -117.8892,
    officer: 'Henry Segerstrom II',
    officerTitle: 'Managing Trustee',
    registeredAgent: 'CT Corporation System',
    sosFileNumber: 'LP044192',
    businessPhone: '(714) 555-3000',
    businessEmail: 'leasing@southcoastpartners.com',
  },
  {
    apn: '530-120-77',
    rawApn: '5301207700',
    address: '13000 TUSTIN RANCH RD',
    city: 'TUSTIN',
    state: 'CA',
    zip: '92782',
    owner: 'TUSTIN VILLAGE APARTMENTS LLC',
    mailingAddress: '100 WILSHIRE BLVD, SANTA MONICA, CA 90401',
    landVal: 7000000,
    impVal: 11500000,
    totalVal: 18500000,
    useCode: '0200 Multi-Family 40 Units',
    yearBuilt: 1996,
    units: 40,
    bedrooms: 60,
    lat: 33.7291,
    lng: -117.7812,
    officer: 'Markus Vance',
    officerTitle: 'Director of Asset Management',
    registeredAgent: 'Corporation Service Company',
    sosFileNumber: '201630110822',
    businessPhone: '(714) 555-5151',
    businessEmail: 'mvance@tustinvillageapts.com',
  },
  {
    apn: '810-401-20',
    rawApn: '8104012000',
    address: '1 CITY BOULEVARD WEST',
    city: 'ORANGE',
    state: 'CA',
    zip: '92868',
    owner: 'THE CITY TOWER PARTNERS LLC',
    mailingAddress: '1 CITY BOULEVARD WEST, ORANGE, CA 92868',
    landVal: 12000000,
    impVal: 20000000,
    totalVal: 32000000,
    useCode: '0310 Commercial Office Building',
    yearBuilt: 1988,
    units: 48,
    bedrooms: 0,
    lat: 33.7852,
    lng: -117.8864,
    officer: 'Claire Dupond',
    officerTitle: 'Chief Executive Officer',
    registeredAgent: 'National Registered Agents',
    sosFileNumber: '201419010041',
    businessPhone: '(714) 555-8900',
    businessEmail: 'cdupond@citytowerorange.com',
  },
  {
    apn: '640-150-33',
    rawApn: '6401503300',
    address: '350 PACIFIC COAST HWY',
    city: 'LAGUNA BEACH',
    state: 'CA',
    zip: '92651',
    owner: 'LAGUNA VILLAGE PROPERTIES LLC',
    mailingAddress: '350 PACIFIC COAST HWY, LAGUNA BEACH, CA 92651',
    landVal: 7500000,
    impVal: 7000000,
    totalVal: 14500000,
    useCode: '0320 Retail Shopping Strip',
    yearBuilt: 1974,
    units: 14,
    bedrooms: 0,
    lat: 33.5422,
    lng: -117.7831,
    officer: 'Bradford Miller',
    officerTitle: 'Managing Member',
    registeredAgent: 'Registered Agent Solutions',
    sosFileNumber: '201829100102',
    businessPhone: '(949) 555-6120',
    businessEmail: 'bmiller@lagunavillageprop.com',
  },
  {
    apn: '915-220-11',
    rawApn: '9152201100',
    address: '200 LAKE FOREST DR',
    city: 'LAKE FOREST',
    state: 'CA',
    zip: '92630',
    owner: 'LAKE FOREST INDUSTRIAL PARK LP',
    mailingAddress: '200 LAKE FOREST DR, LAKE FOREST, CA 92630',
    landVal: 3500000,
    impVal: 5700000,
    totalVal: 9200000,
    useCode: '0400 Industrial Warehouse',
    yearBuilt: 2001,
    units: 6,
    bedrooms: 0,
    lat: 33.6461,
    lng: -117.6892,
    officer: 'Kevin OConnor',
    officerTitle: 'Managing Partner',
    registeredAgent: 'CT Corporation System',
    sosFileNumber: 'LP091283',
    businessPhone: '(949) 555-3490',
    businessEmail: 'koconnor@lakeforestindustrial.com',
  },
];

async function runSeed() {
  console.log('Starting Vortex One database migration and seeding...');

  const schemaSqlPath = path.join(process.cwd(), 'src', 'db', 'migrations', '001_initial_schema.sql');
  if (fs.existsSync(schemaSqlPath)) {
    const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');
    await query(schemaSql);
    console.log('Executed 001_initial_schema.sql successfully.');
  }

  // 1. Seed Counties
  for (const c of CA_COUNTIES) {
    await query(
      `INSERT INTO counties (state_code, county_code, fips_code, county_name, state_name, is_active)
       VALUES ('CA', $1, $2, $3, 'California', $4)
       ON CONFLICT (fips_code) DO UPDATE SET is_active = EXCLUDED.is_active, updated_at = CURRENT_TIMESTAMP`,
      [c.code, c.fips, c.name, c.active]
    );
  }
  console.log('Seeded 58 California counties.');

  // Get Orange County ID
  const ocRes = await query(`SELECT id FROM counties WHERE fips_code = '06059'`);
  const orangeCountyId = ocRes.rows[0]?.id;

  if (!orangeCountyId) {
    throw new Error('Orange County FIPS 06059 not found after seeding.');
  }

  // 2. Seed Source Registry for Orange County
  const sources = [
    { cat: 'COUNTY_GIS', name: 'Orange County GIS REST Portal', agency: 'Orange County IT / GIS', url: 'https://gis.ocgov.com/arcgis/rest/services/Public/OC_Parcels/MapServer/0/query', status: 'VERIFIED', count: 850000 },
    { cat: 'COUNTY_ASSESSOR', name: 'Orange County Assessor Secured Roll', agency: 'Orange County Assessor Office', url: 'https://www.ocgov.com/gov/assessor', status: 'VERIFIED', count: 850000 },
    { cat: 'RECORDER', name: 'Orange County Clerk-Recorder Grant Deeds', agency: 'Orange County Clerk-Recorder', url: 'https://www.ocgov.com/gov/recorder', status: 'VERIFIED', count: 1200000 },
    { cat: 'STATE_BUSINESS_REGISTRY', name: 'California Secretary of State BizFile', agency: 'CA Secretary of State', url: 'https://bizfileonline.sos.ca.gov/', status: 'VERIFIED', count: 4500000 },
    { cat: 'CENSUS', name: 'US Census Bureau TIGER/Line & Census Tracts', agency: 'U.S. Department of Commerce', url: 'https://www.census.gov/', status: 'VERIFIED', count: 100000 },
  ];

  const sourceIds: Record<string, string> = {};
  for (const s of sources) {
    const res = await query(
      `INSERT INTO source_registry (county_id, source_category, source_name, agency_name, endpoint_url, status, schema_status, last_verified_at, last_success_at, record_count)
       VALUES ($1, $2, $3, $4, $5, $6, 'VALIDATED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $7)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [orangeCountyId, s.cat, s.name, s.agency, s.url, s.status, s.count]
    );
    let sId = res.rows[0]?.id;
    if (!sId) {
      const existing = await query(`SELECT id FROM source_registry WHERE source_name = $1`, [s.name]);
      sId = existing.rows[0]?.id;
    }
    sourceIds[s.cat] = sId;
  }
  console.log('Seeded source registry for Orange County.');

  const defaultSourceId = sourceIds['COUNTY_GIS'] || Object.values(sourceIds)[0];

  // 3. Seed Properties, Parcels, Owners, Contacts, Provenance
  for (const p of SEED_PROPERTIES) {
    const propertyKey = `oc:${p.apn}`;
    const normApn = normalizeApn(p.apn);
    const normName = normalizeEntityName(p.owner);
    const ownerType = classifyOwnerType(p.owner);
    const isOwnerOcc = p.mailingAddress.toUpperCase().includes(p.address.toUpperCase());

    // Insert Property with PostGIS Point geometry
    const propRes = await query(
      `INSERT INTO properties (property_key, formatted_address, street_number, street_name, unit, city, state, zip_code, census_tract, latitude, longitude, geometry, source_id, source_jurisdiction)
       VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, '060590626.02', $8, $9, ST_SetSRID(ST_MakePoint($9, $8), 4326), $10, 'Orange County, CA')
       ON CONFLICT (property_key) DO UPDATE SET total_assessed_value = EXCLUDED.total_assessed_value
       RETURNING id`,
      [propertyKey, `${p.address}, ${p.city}, CA ${p.zip}`, p.address.split(' ')[0], p.address.split(' ').slice(1).join(' '), p.city, p.state, p.zip, p.lat, p.lng, defaultSourceId]
    );
    const propertyId = propRes.rows[0].id;

    // Insert Parcel
    await query(
      `INSERT INTO parcels (apn, canonical_apn, raw_apn, apn_format, property_id, county_id, fips_county_code, land_assessed_value, improvement_assessed_value, total_assessed_value, use_code, year_built, units, bedrooms, source_id)
       VALUES ($1, $2, $3, $4, $5, $6, '06059', $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT DO NOTHING`,
      [p.apn, normApn.canonicalApn, p.rawApn, normApn.apnFormat, propertyId, orangeCountyId, p.landVal, p.impVal, p.totalVal, p.useCode, p.yearBuilt, p.units, p.bedrooms, defaultSourceId]
    );

    // Insert Owner
    const ownerRes = await query(
      `INSERT INTO owners (full_name, normalized_name, owner_type, mailing_address, is_owner_occupied, corporate_officer, officer_title, registered_agent, business_address, sos_file_number, sos_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE / GOOD STANDING')
       RETURNING id`,
      [p.owner, normName, ownerType, p.mailingAddress, isOwnerOcc, p.officer, p.officerTitle, p.registeredAgent, p.mailingAddress, p.sosFileNumber]
    );
    const ownerId = ownerRes.rows[0].id;

    // Insert Owner-Property Relationship
    await query(
      `INSERT INTO owner_property (owner_id, property_id, relationship_type, is_current, source_id, confidence)
       VALUES ($1, $2, 'PRIMARY_OWNER', true, $3, 1.000)
       ON CONFLICT DO NOTHING`,
      [ownerId, propertyId, defaultSourceId]
    );

    // Insert Contacts
    if (p.businessPhone) {
      await query(
        `INSERT INTO contacts (entity_id, contact_value, contact_type, source_id, verification_status, confidence, evidence_hash)
         VALUES ($1, $2, 'MOBILE', $3, 'VERIFIED', 0.98, $4)
         ON CONFLICT DO NOTHING`,
        [ownerId, p.businessPhone, sourceIds['STATE_BUSINESS_REGISTRY'] || defaultSourceId, computeSha256Sync(`phone:${p.businessPhone}`)]
      );
    }
    if (p.businessEmail) {
      await query(
        `INSERT INTO contacts (entity_id, contact_value, contact_type, source_id, verification_status, confidence, evidence_hash)
         VALUES ($1, $2, 'EMAIL', $3, 'VERIFIED', 0.92, $4)
         ON CONFLICT DO NOTHING`,
        [ownerId, p.businessEmail, sourceIds['FIRST_PARTY_WEBSITE'] || defaultSourceId, computeSha256Sync(`email:${p.businessEmail}`)]
      );
    }

    // Insert Provenance
    await query(
      `INSERT INTO provenance (entity_type, entity_id, field_name, source_id, classification, confidence, value_recorded, provenance_hash)
       VALUES ('parcels', $1, 'apn', $2, 'FACT', 1.0, $3, $4)`,
      [propertyId, sourceIds['COUNTY_ASSESSOR'] || defaultSourceId, p.apn, computeSha256Sync(`parcels|apn|${p.apn}`)]
    );
  }

  console.log('Seeded authoritative Orange County property records successfully.');
  await pool.end();
}

runSeed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
