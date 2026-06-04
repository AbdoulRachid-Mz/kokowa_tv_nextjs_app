// lib/realtime/builders/subgroup-builder.ts
import { query } from "@/lib/db/neon-client";
import type { RealtimeSubGroupDocument } from "@/types/realtime";

export async function buildRealtimeSubGroupPayload(
  subGroupId: number
): Promise<{ payload: Omit<RealtimeSubGroupDocument, 'matches'>; editionId: number }> {
  const sgRows = await query<any>(
    `SELECT 
       sg.status,
       sg.score_region1,
       sg.score_region2,
       sg.nulls,
       ce.id AS edition_id
     FROM sub_groups sg
     JOIN phase_groups pg ON pg.id = sg.group_id
     JOIN phases p ON p.id = pg.phase_id
     JOIN competition_editions ce ON ce.id = p.edition_id
     WHERE sg.id = $1`,
    [subGroupId]
  );

  if (!sgRows.length) {
    throw new Error(`Sous-groupe ${subGroupId} introuvable`);
  }

  const row = sgRows[0];

  const summaryRows = await query<any>(
    `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
       SUM(CASE WHEN status = 'live' THEN 1 ELSE 0 END) as live
     FROM matches 
     WHERE sub_group_id = $1 AND is_active = true`,
    [subGroupId]
  );

  const summary = summaryRows[0] || { total: 0, completed: 0, live: 0 };

  const payload: Omit<RealtimeSubGroupDocument, 'matches'> = {
    status: row.status,
    score: {
      region1: row.score_region1 ?? 0,
      region2: row.score_region2 ?? 0,
      nulls: row.nulls ?? 0,
    },
    summary: {
      total: parseInt(summary.total || "0", 10),
      completed: parseInt(summary.completed || "0", 10),
      live: parseInt(summary.live || "0", 10),
    },
    updatedAt: Date.now(),
  };

  return { payload, editionId: row.edition_id };
}