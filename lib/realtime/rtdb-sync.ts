// lib/realtime/rtdb-sync.ts
import { getAdminRTDB } from "./rtdb-admin";
import { buildRealtimeMatchPayload } from "./builders/match-builder";
import { buildRealtimeSubGroupPayload } from "./builders/subgroup-builder";
import { REALTIME_NODES, RealtimeLiveMatchInfo } from "@/types/realtime";

/**
 * Met à jour un match dans RTDB.
 * Chemin : editions/{editionId}/subGroups/{subGroupId}/matches/{matchId}
 */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms),
    ),
  ]);
}

export async function syncMatchRealtime(
  matchId: number,
  event?: string
): Promise<void> {
  try {
    const { payload, editionId, subGroupId } = await withTimeout(
      buildRealtimeMatchPayload(matchId),
      8000,
      "buildRealtimeMatchPayload",
    );
    
    // 🔥 On met à jour dans RTDB si le match est actif ou vient de se terminer
    if (payload.status === "scheduled") {
      try {
        const db = getAdminRTDB();
        const ref = db.ref(
          `${REALTIME_NODES.EDITIONS}/${editionId}/subGroups/${subGroupId}/matches/${matchId}`,
        );
        await withTimeout(ref.remove(), 8000, "rtdb ref.remove");
        console.log(`RTDB: match ${matchId} retire du temps reel (status scheduled)`);
      } catch (err) {
        console.error("RTDB remove error:", err);
      }
      return;
    }

    const db = getAdminRTDB();
    const ref = db.ref(
      `${REALTIME_NODES.EDITIONS}/${editionId}/subGroups/${subGroupId}/matches/${matchId}`
    );
    
    await withTimeout(ref.update(payload), 8000, "rtdb ref.update");

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
    const { payload, editionId } = await withTimeout(
      buildRealtimeSubGroupPayload(subGroupId),
      8000,
      "buildRealtimeSubGroupPayload",
    );
    
    const db = getAdminRTDB();
    const ref = db.ref(
      `${REALTIME_NODES.EDITIONS}/${editionId}/subGroups/${subGroupId}`
    );
    
    await withTimeout(ref.update(payload), 8000, "rtdb ref.update");

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
    
    await withTimeout(
      ref.update({
        isLive,
        status,
        updatedAt: Date.now(),
      }),
      8000,
      "rtdb updateMatchLiveState",
    );
  } catch (error) {
    console.error(`❌ RTDB updateMatchLiveState failed for match ${matchId}:`, error);
  }
}

/**
 * Met à jour le match live de l'édition
 */
export async function clearEditionLiveMatchIfMatches(
  editionId: number,
  matchId: number,
): Promise<void> {
  try {
    const db = getAdminRTDB();
    const ref = db.ref(`${REALTIME_NODES.EDITIONS}/${editionId}`);
    const snap = await withTimeout(ref.once("value"), 8000, "rtdb clearEditionLiveMatch read");
    const val = snap.val() as any;
    if (val?.liveMatch && Number(val.liveMatch.matchId) === Number(matchId)) {
      await withTimeout(ref.update({ liveMatch: null, updatedAt: Date.now() }), 8000, "rtdb clearEditionLiveMatch update");
      console.log(`RTDB: liveMatch cleared for edition ${editionId} (match ${matchId})`);
    }
  } catch (error) {
    console.error(`RTDB clearEditionLiveMatchIfMatches failed for edition ${editionId}:`, error);
  }
}

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
    await withTimeout(ref.update(update), 8000, "rtdb syncEditionLiveMatch");
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