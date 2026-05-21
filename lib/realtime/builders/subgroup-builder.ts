// lib/realtime/builders/subgroup-builder.ts
// Construit le payload minimal d'un sous-groupe pour Firebase RTDB
// SERVER-SIDE ONLY

import { query } from "@/lib/db/neon-client";
import type { RealtimeSubGroupDocument } from "@/types/realtime";

export async function buildRealtimeSubGroupPayload(
  subGroupId: number
): Promise<Omit<RealtimeSubGroupDocument, 'matches'>> {
  const sgRows = await query<any>(
    `SELECT 
       sg.status,
       sg.score_region1,
       sg.score_region2,
       sg.nulls
     FROM sub_groups sg
     WHERE sg.id = $1`,
    [subGroupId]
  );

  if (!sgRows.length) {
    throw new Error(`Sous-groupe ${subGroupId} introuvable`);
  }

  const row = sgRows[0];

  // Compter les matchs
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

  return payload;
}
