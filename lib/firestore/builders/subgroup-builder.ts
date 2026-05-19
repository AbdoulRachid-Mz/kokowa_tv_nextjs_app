// lib/firestore/builders/subgroup-builder.ts
// Construit un document RealtimeSubGroupDocument depuis PostgreSQL
// SERVER-SIDE ONLY

import { query } from "@/lib/db/neon-client";
import type {
  RealtimeSubGroupDocument,
  RealtimeRegionData,
} from "@/types/realtime";

// Types internes pour les lignes PostgreSQL
interface SubGroupRow {
  id: number;
  name: string;
  status: string;
  is_completed: boolean;
  score_region1: number | null;
  score_region2: number | null;
  nulls: number | null;
  region1_id: number | null;
  region2_id: number | null;
  edition_id: number;
  edition_number: number;
}

interface RegionRow {
  id: number;
  name: string;
  code: string | null;
  flag_image: string | null;
}

interface MatchSummaryRow {
  total: string;
  completed: string;
  live: string;
}

/**
 * Construit un document Firestore complet pour un sous-groupe.
 *
 * Note: la fonction `query` de neon-client retourne T[] directement (pas { rows }).
 */
export async function buildRealtimeSubGroupDocument(
  subGroupId: number
): Promise<RealtimeSubGroupDocument> {
  // ─── 1. SubGroup + Edition ───────────────────────────────────────────────
  const sgRows = await query<SubGroupRow>(
    `SELECT 
       sg.id,
       sg.name,
       sg.status,
       sg.is_completed,
       sg.score_region1,
       sg.score_region2,
       sg.nulls,
       sg.region1_id,
       sg.region2_id,

       ed.id             AS edition_id,
       ed.edition_number AS edition_number

     FROM sub_groups sg
     JOIN phase_groups pg ON sg.group_id = pg.id
     JOIN phases ph       ON pg.phase_id = ph.id
     JOIN competition_editions ed     ON ph.edition_id = ed.id
     WHERE sg.id = $1 AND sg.is_active = true`,
    [subGroupId]
  );

  if (!sgRows.length) {
    throw new Error(`Sous-groupe ${subGroupId} introuvable ou inactif`);
  }

  const sg = sgRows[0];

  // ─── 2. Régions ─────────────────────────────────────────────────────────
  const regionIds = [sg.region1_id, sg.region2_id].filter(
    (id): id is number => id !== null
  );
  let region1Data: RealtimeRegionData = { id: sg.region1_id };
  let region2Data: RealtimeRegionData = { id: sg.region2_id };

  if (regionIds.length > 0) {
    const regions = await query<RegionRow>(
      `SELECT id, name, code, flag_image FROM regions WHERE id = ANY($1)`,
      [regionIds]
    );

    for (const r of regions) {
      const rData: RealtimeRegionData = {
        id: r.id,
        name: r.name,
        code: r.code,
        flag_image: r.flag_image,
      };
      if (r.id === sg.region1_id) region1Data = rData;
      if (r.id === sg.region2_id) region2Data = rData;
    }
  }

  // ─── 3. Résumé des matchs ────────────────────────────────────────────────
  const summaryRows = await query<MatchSummaryRow>(
    `SELECT
       COUNT(*)::text                                             AS total,
       COUNT(*) FILTER (WHERE status = 'completed')::text        AS completed,
       COUNT(*) FILTER (WHERE status = 'live')::text             AS live
     FROM matches
     WHERE sub_group_id = $1 AND is_active = true`,
    [subGroupId]
  );

  const summary = summaryRows[0] ?? { total: "0", completed: "0", live: "0" };

  // ─── 4. Assemblage ────────────────────────────────────────────────────────
  const now = Date.now();

  const doc: RealtimeSubGroupDocument = {
    id: sg.id,
    entityType: "subGroup",
    updatedAt: now,
    createdAt: now,

    subGroup: {
      id: sg.id,
      name: sg.name,
      status: sg.status,
      is_completed: sg.is_completed,
      score_region1: sg.score_region1 ?? 0,
      score_region2: sg.score_region2 ?? 0,
      nulls: sg.nulls ?? 0,
      region1_id: sg.region1_id,
      region2_id: sg.region2_id,
    },

    regions: {
      region1: region1Data,
      region2: region2Data,
    },

    matchesSummary: {
      total: parseInt(summary.total, 10) || 0,
      completed: parseInt(summary.completed, 10) || 0,
      live: parseInt(summary.live, 10) || 0,
    },

    edition: {
      id: sg.edition_id,
      edition_number: sg.edition_number,
    },

    realtime: {},

    metadata: {
      source: "postgres",
      syncVersion: 1,
    },
  };

  return doc;
}
