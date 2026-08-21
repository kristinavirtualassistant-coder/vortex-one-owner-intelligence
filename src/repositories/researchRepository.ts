import { query } from '../db/client.js';
import { ResearchTask } from '../types';

export const researchRepository = {
  async findAll(): Promise<ResearchTask[]> {
    const res = await query(`SELECT * FROM research_tasks ORDER BY created_at DESC`);
    return res.rows.map((row) => ({
      id: row.id,
      taskType: row.task_type as any,
      targetEntityType: row.target_entity_type,
      targetEntityId: row.target_entity_id,
      targetEntityName: row.target_entity_name,
      reason: row.reason,
      priority: row.priority as any,
      status: row.status as any,
      createdAt: row.created_at,
    }));
  },

  async completeTask(id: string) {
    const res = await query(
      `UPDATE research_tasks SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP, completed_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );
    return res.rows[0] || null;
  },

  async createTask(task: Omit<ResearchTask, 'id' | 'createdAt' | 'status'>) {
    const res = await query(
      `INSERT INTO research_tasks (task_type, target_entity_type, target_entity_id, target_entity_name, reason, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
       RETURNING *`,
      [task.taskType, task.targetEntityType, task.targetEntityId, task.targetEntityName, task.reason, task.priority]
    );
    return res.rows[0];
  }
};
