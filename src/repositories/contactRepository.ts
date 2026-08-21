import { query } from '../db/client.js';
import { ContactRecord } from '../types';

export const contactRepository = {
  async findByEntityId(entityId: string): Promise<ContactRecord[]> {
    const res = await query(
      `SELECT c.*, s.source_name, s.endpoint_url as source_url
       FROM contacts c
       LEFT JOIN source_registry s ON c.source_id = s.id
       WHERE c.entity_id = $1`,
      [entityId]
    );
    return res.rows.map((row) => ({
      id: row.id,
      entityId: row.entity_id,
      contactValue: row.contact_value,
      contactType: row.contact_type as any,
      isTrackedLine: row.is_tracked_line,
      sourceId: row.source_id,
      sourceUrl: row.source_url,
      verificationStatus: row.verification_status as any,
      confidence: Number(row.confidence),
      evidenceHash: row.evidence_hash,
      discoveredAt: row.discovered_at,
    }));
  }
};
