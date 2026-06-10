// lib/realtime/rtdb-sync.ts
import { getAdminRTDB } from "./rtdb-admin";
import { buildRealtimeMatchPayload } from "./builders/match-builder";
import { buildRealtimeSubGroupPayload } from "./builders/subgroup-builder";
import { REALTIME_NODES, RealtimeLiveMatchInfo } from "@/types/realtime";

/**
 * Met à jour un match dans RTDB.
 * Chemin : editions/{editionId}/subGroups/{subGroupId}/matches/{matchId}
 */
export async function syncMatchRealtime(
  matchId: number,
  event?: string
): Promise<void> {
  try {
    const { payload, editionId, subGroupId } = await buildRealtimeMatchPayload(matchId);
    
    // 🔥 On ne crée/met à jour dans RTDB que si le match est dans un état "actif" (live, break, reclamation)
    const activeStatuses = ["live", "round_break", "reclamation"];
    if (!activeStatuses.includes(payload.status)) {
      console.log(`ℹ️ RTDB sync skipped: match ${matchId} is ${payload.status}`);
      return;
    }

    const db = getAdminRTDB();
    const ref = db.ref(
      `${REALTIME_NODES.EDITIONS}/${editionId}/subGroups/${subGroupId}/matches/${matchId}`
    );
    
    await ref.update(payload);

    console.log(`✅ RTDB sync: match ${matchId} (edition ${editionId}, subGroup ${subGroupId}) | event: ${event ?? "none"} | live: ${payload.isLive}`);
  } catch (error) {
    console.error(`❌ RTDB sync failed for match ${matchId}:`, error);
  }
}

/**
 * Supprime tous les matches d'un sous-groupe de RTDB
 */
export async function deleteRealtimeSubGroupMatches(
  subGroupId: number,
  editionId: number
): Promise<void> {
  try {
    const db = getAdminRTDB();
    const ref = db.ref(`${REALTIME_NODES.EDITIONS}/${editionId}/subGroups/${subGroupId}/matches`);
    await ref.remove();
    console.log(`🗑️ RTDB: matches du subGroup ${subGroupId} supprimés (edition ${editionId})`);
  } catch (error) {
    console.error(`❌ RTDB deleteRealtimeSubGroupMatches failed for subGroup ${subGroupId}:`, error);
  }
}

/**
 * Met à jour un sous-groupe dans RTDB.
 * Chemin : editions/{editionId}/subGroups/{subGroupId}
 */
export async function syncSubGroupRealtime(
  subGroupId: number,
  event?: string
): Promise<void> {
  try {
    const { payload, editionId } = await buildRealtimeSubGroupPayload(subGroupId);
    
    const db = getAdminRTDB();
    const ref = db.ref(
      `${REALTIME_NODES.EDITIONS}/${editionId}/subGroups/${subGroupId}`
    );
    
    await ref.update(payload);

    console.log(`✅ RTDB sync: subGroup ${subGroupId} (edition ${editionId}) | event: ${event ?? "none"}`);
  } catch (error) {
    console.error(`❌ RTDB sync failed for subGroup ${subGroupId}:`, error);
  }
}

/**
 * Met à jour uniquement le statut live d'un match
 */
export async function updateMatchLiveState(
  matchId: number,
  editionId: number,
  subGroupId: number,
  isLive: boolean,
  status: string,
  event?: string
): Promise<void> {
  try {
    const db = getAdminRTDB();
    const ref = db.ref(
      `${REALTIME_NODES.EDITIONS}/${editionId}/subGroups/${subGroupId}/matches/${matchId}`
    );
    
    await ref.update({
      isLive,
      status,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error(`❌ RTDB updateMatchLiveState failed for match ${matchId}:`, error);
  }
}

/**
 * Met à jour le match live de l'édition
 */
export async function syncEditionLiveMatch(
  editionId: number,
  liveMatchInfo: RealtimeLiveMatchInfo | null
): Promise<void> {
  try {
    const db = getAdminRTDB();
    const ref = db.ref(`${REALTIME_NODES.EDITIONS}/${editionId}`);
    const update: any = {
      updatedAt: Date.now()
    };
    if (liveMatchInfo === null) {
      update.liveMatch = null;
    } else {
      update.liveMatch = liveMatchInfo;
    }
    await ref.update(update);
    console.log(`✅ RTDB liveMatch sync for edition ${editionId}: ${liveMatchInfo ? `match ${liveMatchInfo.matchId}` : 'cleared'}`);
  } catch (error) {
    console.error(`❌ RTDB syncEditionLiveMatch failed for edition ${editionId}:`, error);
  }
}

/**
 * Supprime un match de RTDB
 */
export async function deleteRealtimeMatchDocument(
  matchId: number,
  editionId: number,
  subGroupId: number
): Promise<void> {
  try {
    const db = getAdminRTDB();
    const ref = db.ref(
      `${REALTIME_NODES.EDITIONS}/${editionId}/subGroups/${subGroupId}/matches/${matchId}`
    );
    await ref.remove();
    console.log(`🗑️ RTDB: match ${matchId} supprimé (edition ${editionId}, subGroup ${subGroupId})`);
  } catch (error) {
    console.error(`❌ RTDB delete failed for match ${matchId}:`, error);
  }
}

/**
 * Supprime un sous-groupe (y compris ses matchs imbriqués)
 */
export async function deleteRealtimeSubGroupDocument(
  subGroupId: number,
  editionId: number
): Promise<void> {
  try {
    const db = getAdminRTDB();
    const ref = db.ref(`${REALTIME_NODES.EDITIONS}/${editionId}/subGroups/${subGroupId}`);
    await ref.remove();
    console.log(`🗑️ RTDB: subGroup ${subGroupId} supprimé (edition ${editionId})`);
  } catch (error) {
    console.error(`❌ RTDB delete failed for subGroup ${subGroupId}:`, error);
  }
}

export async function getRealtimeDBStats(): Promise<{ firestoreConnected: boolean }> {
  return { firestoreConnected: true };
}