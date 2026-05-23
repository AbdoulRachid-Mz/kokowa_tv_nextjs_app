// lib/realtime/rtdb-sync.ts
// Service principal de synchronisation Firebase RTDB

import { getAdminRTDB } from "./rtdb-admin";
import { buildRealtimeMatchPayload } from "./builders/match-builder";
import { buildRealtimeSubGroupPayload } from "./builders/subgroup-builder";
import { REALTIME_NODES } from "@/types/realtime";

/**
 * Met à jour un match dans RTDB.
 * Il est stocké sous subGroups/{subGroupId}/matches/{matchId}
 */
export async function syncMatchRealtime(
  matchId: number,
  event?: string
): Promise<void> {
  try {
    const { payload, subGroupId } = await buildRealtimeMatchPayload(matchId);
    
    const db = getAdminRTDB();
    const ref = db.ref(`${REALTIME_NODES.SUBGROUPS}/${subGroupId}/matches/${matchId}`);
    
    // .update() ne remplace que les clés fournies
    await ref.update(payload);

    console.log(`✅ RTDB sync: match ${matchId} dans subGroup ${subGroupId} | event: ${event ?? "none"} | live: ${payload.isLive}`);
  } catch (error) {
    console.error(`❌ RTDB sync failed for match ${matchId}:`, error);
  }
}

/**
 * Met à jour un sous-groupe dans RTDB.
 * Ne touche pas à la sous-collection `matches` grâce à .update().
 */
export async function syncSubGroupRealtime(
  subGroupId: number,
  event?: string
): Promise<void> {
  try {
    const payload = await buildRealtimeSubGroupPayload(subGroupId);
    
    const db = getAdminRTDB();
    const ref = db.ref(`${REALTIME_NODES.SUBGROUPS}/${subGroupId}`);
    
    await ref.update(payload);

    console.log(`✅ RTDB sync: subGroup ${subGroupId} | event: ${event ?? "none"}`);
  } catch (error) {
    console.error(`❌ RTDB sync failed for subGroup ${subGroupId}:`, error);
  }
}

/**
 * Met à jour uniquement le statut live d'un match pour optimiser les coûts.
 */
export async function updateMatchLiveState(
  matchId: number,
  subGroupId: number,
  isLive: boolean,
  status: string,
  event?: string
): Promise<void> {
  try {
    const db = getAdminRTDB();
    const ref = db.ref(`${REALTIME_NODES.SUBGROUPS}/${subGroupId}/matches/${matchId}`);
    
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
  subGroupId: number | null,
  matchId: number | null
): Promise<void> {
  try {
    const db = getAdminRTDB();
    const ref = db.ref(`${REALTIME_NODES.EDITIONS}/${editionId}`);
    
    await ref.update({
      status: "ongoing", // Ou fetch depuis DB si besoin
      liveMatch: subGroupId && matchId ? { subGroupId, matchId } : null,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error(`❌ RTDB syncEditionLiveMatch failed for edition ${editionId}:`, error);
  }
}

/**
 * Supprime un match de RTDB
 */
export async function deleteRealtimeMatchDocument(
  matchId: number,
  subGroupId: number
): Promise<void> {
  try {
    const db = getAdminRTDB();
    const ref = db.ref(`${REALTIME_NODES.SUBGROUPS}/${subGroupId}/matches/${matchId}`);
    await ref.remove();
    console.log(`🗑️ RTDB: match ${matchId} supprimé du subGroup ${subGroupId}`);
  } catch (error) {
    console.error(`❌ RTDB delete failed for match ${matchId}:`, error);
  }
}

/**
 * Supprime un sous-groupe (y compris ses matchs imbriqués)
 */
export async function deleteRealtimeSubGroupDocument(
  subGroupId: number
): Promise<void> {
  try {
    const db = getAdminRTDB();
    const ref = db.ref(`${REALTIME_NODES.SUBGROUPS}/${subGroupId}`);
    await ref.remove();
    console.log(`🗑️ RTDB: subGroup ${subGroupId} supprimé`);
  } catch (error) {
    console.error(`❌ RTDB delete failed for subGroup ${subGroupId}:`, error);
  }
}

/**
 * Récupère les stats basiques de RTDB.
 */
export async function getRealtimeDBStats(): Promise<{
  firestoreConnected: boolean;
}> {
  return {
    firestoreConnected: true,
  };
}
