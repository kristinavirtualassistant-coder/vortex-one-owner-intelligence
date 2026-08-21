import { query } from '../db/client.js';
import { ProvenanceLog } from '../types';

export const provenanceRepository = {
  async findByEntity(entityId: string): Promise<ProvenanceLog[]> {
    const res = await query(
      `SELECT * FROM provenance WHERE entity_id = $1`,
      [entityId]
    );
    return res.rows.map((row) => ({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      fieldName: row.field_name,
      sourceId: row.source_id,
      rawPayloadId: row.raw_payload_id,
      classification: row.classification as any,
      confidence: Number(row.confidence),
      valueRecorded: row.value_recorded,
      provenanceHash: row.provenance_hash,
      recordedAt: row.recorded_at,
    }));
  }
};
