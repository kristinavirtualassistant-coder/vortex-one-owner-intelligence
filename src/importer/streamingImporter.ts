/**
 * Vortex One Streaming GIS & Parcel Roll Importer
 * Streams multi-gigabyte GIS datasets in configurable batches with transactional commits,
 * provenance hashing, error quarantine, and checkpoint resumption.
 */

import { Readable } from 'stream';
import readline from 'readline';
import { getClient } from '../db/client.js';
import { normalizeApn, parseAddressComponents, normalizeEntityName, classifyOwnerType, computeSha256Sync } from '../lib/normalizers.js';
import { RawGisFeature, ImportOptions, ImportStats, ImportErrorRecord } from './types.js';

export class StreamingGisImporter {
  private options: Required<Omit<ImportOptions, 'onProgress'>> & { onProgress?: (stats: ImportStats) => void };

  constructor(options: ImportOptions) {
    this.options = {
      sourceId: options.sourceId,
      countyId: options.countyId,
      fipsCode: options.fipsCode,
      sourceJurisdiction: options.sourceJurisdiction,
      batchSize: options.batchSize && options.batchSize > 0 ? options.batchSize : 1000,
      strictMode: !!options.strictMode,
      checkpointResumeIndex: options.checkpointResumeIndex || 0,
      onProgress: options.onProgress,
    };
  }

  /**
   * Process a stream of line-delimited JSON (NDJSON) or GeoJSON features
   */
  public async importLineDelimitedStream(inputStream: Readable): Promise<ImportStats> {
    const stats: ImportStats = {
      totalProcessed: 0,
      totalInserted: 0,
      totalFailed: 0,
      totalSkipped: 0,
      batchesCount: 0,
      startTime: Date.now(),
      errors: [],
      lastProcessedCheckpoint: this.options.checkpointResumeIndex,
    };

    const rl = readline.createInterface({
      input: inputStream,
      crlfDelay: Infinity,
    });

    let currentBatch: RawGisFeature[] = [];
    let recordIndex = 0;

    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === '[' || trimmed === ']' || trimmed === ',') {
        continue;
      }

      // Strip trailing comma if GeoJSON feature collection format
      const cleanLine = trimmed.endsWith(',') ? trimmed.slice(0, -1) : trimmed;

      if (recordIndex < this.options.checkpointResumeIndex) {
        recordIndex++;
        stats.totalSkipped++;
        continue;
      }

      try {
        const feature = JSON.parse(cleanLine) as RawGisFeature;
        currentBatch.push(feature);
        recordIndex++;
        stats.totalProcessed++;

        if (currentBatch.length >= this.options.batchSize) {
          await this.flushBatch(currentBatch, stats);
          currentBatch = [];
          stats.lastProcessedCheckpoint = recordIndex;
          if (this.options.onProgress) {
            this.options.onProgress({ ...stats, durationMs: Date.now() - stats.startTime });
          }
        }
      } catch (err: any) {
        stats.totalFailed++;
        const errorRecord: ImportErrorRecord = {
          recordIndex,
          error: `Malformed JSON line: ${err.message}`,
          timestamp: new Date().toISOString(),
        };
        stats.errors.push(errorRecord);

        if (this.options.strictMode) {
          stats.endTime = Date.now();
          stats.durationMs = stats.endTime - stats.startTime;
          throw new Error(`Strict mode import aborted at record ${recordIndex}: ${err.message}`);
        }
      }
    }

    // Flush any remaining records
    if (currentBatch.length > 0) {
      await this.flushBatch(currentBatch, stats);
      stats.lastProcessedCheckpoint = recordIndex;
    }

    stats.endTime = Date.now();
    stats.durationMs = stats.endTime - stats.startTime;

    if (this.options.onProgress) {
      this.options.onProgress(stats);
    }

    return stats;
  }

  /**
   * Process an in-memory or chunked array of RawGisFeatures
   */
  public async importFeatureBatch(features: RawGisFeature[]): Promise<ImportStats> {
    const stats: ImportStats = {
      totalProcessed: 0,
      totalInserted: 0,
      totalFailed: 0,
      totalSkipped: 0,
      batchesCount: 0,
      startTime: Date.now(),
      errors: [],
      lastProcessedCheckpoint: this.options.checkpointResumeIndex,
    };

    let currentBatch: RawGisFeature[] = [];

    for (let i = 0; i < features.length; i++) {
      if (i < this.options.checkpointResumeIndex) {
        stats.totalSkipped++;
        continue;
      }

      currentBatch.push(features[i]);
      stats.totalProcessed++;

      if (currentBatch.length >= this.options.batchSize) {
        await this.flushBatch(currentBatch, stats);
        currentBatch = [];
        stats.lastProcessedCheckpoint = i + 1;
        if (this.options.onProgress) {
          this.options.onProgress({ ...stats, durationMs: Date.now() - stats.startTime });
        }
      }
    }

    if (currentBatch.length > 0) {
      await this.flushBatch(currentBatch, stats);
      stats.lastProcessedCheckpoint = features.length;
    }

    stats.endTime = Date.now();
    stats.durationMs = stats.endTime - stats.startTime;

    if (this.options.onProgress) {
      this.options.onProgress(stats);
    }

    return stats;
  }

  /**
   * Execute transactional batch insert for a normalized chunk
   */
  private async flushBatch(batch: RawGisFeature[], stats: ImportStats): Promise<void> {
    if (batch.length === 0) return;

    const client = await getClient();
    try {
      if (typeof client.query === 'function') {
        await client.query('BEGIN');
      }

      for (const feature of batch) {
        try {
          await this.insertSingleRecord(client, feature);
          stats.totalInserted++;
        } catch (recordErr: any) {
          stats.totalFailed++;
          stats.errors.push({
            recordIndex: stats.totalProcessed,
            rawApn: feature.properties?.apn || feature.properties?.APN,
            rawAddress: feature.properties?.address || feature.properties?.ADDRESS,
            error: recordErr.message,
            timestamp: new Date().toISOString(),
          });

          if (this.options.strictMode) {
            throw recordErr;
          }
        }
      }

      if (typeof client.query === 'function') {
        await client.query('COMMIT');
      }
      stats.batchesCount++;
    } catch (batchErr: any) {
      if (typeof client.query === 'function') {
        try {
          await client.query('ROLLBACK');
        } catch {
          // ignore rollback error
        }
      }
      throw batchErr;
    } finally {
      if (typeof client.release === 'function') {
        client.release();
      }
    }
  }

  /**
   * Normalize and insert a single GIS feature into PostgreSQL/PostGIS
   */
  private async insertSingleRecord(client: any, feature: RawGisFeature): Promise<void> {
    const p = feature.properties || {};
    const rawApn = String(p.apn || p.APN || p.parcel_id || p.PARCEL_ID || '').trim();
    if (!rawApn) {
      throw new Error('Missing APN or PARCEL_ID identifier in GIS feature properties');
    }

    const normApn = normalizeApn(rawApn);
    const rawAddress = String(p.address || p.ADDRESS || p.SITE_ADDR || '').trim();
    const city = String(p.city || p.CITY || 'IRVINE').trim();
    const state = String(p.state || 'CA').trim();
    const zip = String(p.zip || p.ZIP || '').trim();

    const addrParsed = parseAddressComponents(rawAddress || `${normApn.canonicalApn} UNASSIGNED`, city, state, zip);
    const propertyKey = `${this.options.countyId}:${normApn.canonicalApn}`;

    let lat: number | null = null;
    let lng: number | null = null;

    if (feature.geometry && feature.geometry.coordinates) {
      if (feature.geometry.type === 'Point' && Array.isArray(feature.geometry.coordinates)) {
        lng = Number(feature.geometry.coordinates[0]);
        lat = Number(feature.geometry.coordinates[1]);
      } else if (feature.geometry.type === 'Polygon' && Array.isArray(feature.geometry.coordinates[0]?.[0])) {
        lng = Number(feature.geometry.coordinates[0][0][0]);
        lat = Number(feature.geometry.coordinates[0][0][1]);
      }
    }

    const propId = `prop-${normApn.canonicalApn.replace(/[^a-zA-Z0-9]/g, '')}`;
    const parcelId = `parcel-${normApn.canonicalApn.replace(/[^a-zA-Z0-9]/g, '')}`;
    const ownerName = String(p.owner || p.OWNER_NAME || '').trim();
    const ownerId = ownerName ? `owner-${computeSha256Sync(ownerName).slice(0, 16)}` : null;

    const formattedAddress = addrParsed.unit
      ? `${addrParsed.streetNumber} ${addrParsed.streetName} Unit ${addrParsed.unit}, ${city}, ${state} ${zip}`.trim()
      : `${addrParsed.streetNumber} ${addrParsed.streetName}, ${city}, ${state} ${zip}`.trim();

    // 1. Upsert Property
    const propSql = `
      INSERT INTO properties (
        id, property_key, formatted_address, street_number, street_name, unit,
        city, state, zip_code, census_tract, latitude, longitude,
        source_id, source_jurisdiction, retrieved_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      ON CONFLICT (property_key) DO UPDATE SET
        formatted_address = EXCLUDED.formatted_address,
        latitude = COALESCE(EXCLUDED.latitude, properties.latitude),
        longitude = COALESCE(EXCLUDED.longitude, properties.longitude),
        retrieved_at = NOW()
    `;
    await client.query(propSql, [
      propId,
      propertyKey,
      formattedAddress,
      addrParsed.streetNumber || null,
      addrParsed.streetName || null,
      addrParsed.unit || null,
      city,
      state,
      zip,
      p.census_tract || null,
      lat,
      lng,
      this.options.sourceId,
      this.options.sourceJurisdiction,
    ]);

    // 2. Upsert Parcel with Raw APN & Canonical APN preservation
    const parcelSql = `
      INSERT INTO parcels (
        id, apn, canonical_apn, raw_apn, apn_format, property_id,
        county_id, fips_county_code, land_assessed_value, improvement_assessed_value,
        total_assessed_value, use_code, year_built, units, bedrooms, roll_year, source_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO UPDATE SET
        land_assessed_value = EXCLUDED.land_assessed_value,
        improvement_assessed_value = EXCLUDED.improvement_assessed_value,
        total_assessed_value = EXCLUDED.total_assessed_value,
        year_built = EXCLUDED.year_built,
        units = EXCLUDED.units
    `;

    const landVal = Number(p.land_value || 0);
    const impVal = Number(p.imp_value || 0);
    const totalVal = Number(p.total_value || landVal + impVal);

    await client.query(parcelSql, [
      parcelId,
      normApn.canonicalApn,
      normApn.canonicalApn,
      normApn.rawApn,
      normApn.apnFormat,
      propId,
      this.options.countyId,
      this.options.fipsCode,
      landVal,
      impVal,
      totalVal,
      p.use_code || '0100 Residential',
      p.year_built ? Number(p.year_built) : null,
      p.units ? Number(p.units) : 1,
      p.bedrooms ? Number(p.bedrooms) : null,
      2026,
      this.options.sourceId,
    ]);

    // 3. Upsert Owner if present
    if (ownerName && ownerId) {
      const normOwner = normalizeEntityName(ownerName);
      const ownerType = classifyOwnerType(ownerName);
      const mailingAddr = String(p.mailing_address || formattedAddress).trim();

      const ownerSql = `
        INSERT INTO owners (
          id, full_name, normalized_name, owner_type, mailing_address, is_owner_occupied
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          mailing_address = EXCLUDED.mailing_address
      `;
      await client.query(ownerSql, [
        ownerId,
        ownerName,
        normOwner,
        ownerType,
        mailingAddr,
        mailingAddr.toUpperCase() === formattedAddress.toUpperCase(),
      ]);

      const opSql = `
        INSERT INTO owner_property (id, owner_id, property_id, relationship_type, is_current)
        VALUES ($1, $2, $3, 'PRIMARY_OWNER', true)
        ON CONFLICT (owner_id, property_id) DO NOTHING
      `;
      await client.query(opSql, [`op-${ownerId}-${propId}`, ownerId, propId]);
    }

    // 4. Record Provenance
    const provHash = computeSha256Sync(`parcels|apn|${normApn.canonicalApn}|${this.options.sourceId}`);
    const provSql = `
      INSERT INTO provenance (
        id, entity_type, entity_id, field_name, source_id, classification,
        confidence, value_recorded, provenance_hash, recorded_at
      ) VALUES ($1, 'parcels', $2, 'apn', $3, 'FACT', 1.0, $4, $5, NOW())
      ON CONFLICT DO NOTHING
    `;
    await client.query(provSql, [
      `prov-${normApn.canonicalApn}`,
      parcelId,
      this.options.sourceId,
      normApn.canonicalApn,
      provHash,
    ]);
  }
}
