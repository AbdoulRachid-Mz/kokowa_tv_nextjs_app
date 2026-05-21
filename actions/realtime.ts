// actions/realtime.ts
// Server Actions Realtime — Firestore Edition
// Remplace complètement l'ancien système WebSocket/Redis
//
// Mêmes signatures qu'avant → aucune modification nécessaire dans les appelants
// (match-update.service.ts continue d'appeler emitMatchEvent sans changement)

"use server";

import {
  syncMatchRealtime,
  syncSubGroupRealtime,
  getRealtimeDBStats,
  deleteRealtimeMatchDocument,
  deleteRealtimeSubGroupDocument,
} from "@/lib/realtime/rtdb-sync";
import type { EntityType, RealtimeSyncPayload } from "@/types/realtime";

/**
 * Émet un événement temps réel via Firestore.
 * Remplace l'ancien wsManager.broadcastToEntity().
 *
 * Note : pour les entités 'match' et 'subGroup', utilise les fonctions
 * de sync dédiées. Pour les autres types, un log est émis (extensible).
 */
export async function emitRealtimeEvent(
  entityType: EntityType,
  entityId: number | string,
  event: string,
  data?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const id = Number(entityId);

    if (event === "deleted") {
      await emitRealtimeDelete(entityType, id, data);
      return { success: true };
    }

    switch (entityType) {
      case "match":
        await syncMatchRealtime(id, event);
        break;

      case "subGroup":
        await syncSubGroupRealtime(id, event);
        break;

      case "fighter":
      case "region":
      case "edition":
      case "admin":
        // Extensible
        console.log(`[RTDB] ${entityType}:${entityId} → ${event}`);
        break;

      default:
        console.warn(`[RTDB] Unknown entityType: ${entityType}`);
    }

    return { success: true };
  } catch (error) {
    console.error("❌ emitRealtimeEvent error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Émet un événement de match (et optionnellement au sous-groupe).
 * Signature identique à l'ancienne version WebSocket.
 *
 * Appelé depuis match-update.service.ts après le COMMIT PostgreSQL.
 */
export async function emitMatchEvent(
  matchId: number,
  event: string,
  data?: any,
  subGroupId?: number
): Promise<{ success: boolean }> {
  // Sync Firestore du match
  await syncMatchRealtime(matchId, event);

  // Sync Firestore du sous-groupe si fourni
  if (subGroupId) {
    await syncSubGroupRealtime(subGroupId, event);
  }

  return { success: true };
}

/**
 * Émet un événement de sous-groupe.
 */
export async function emitSubGroupEvent(
  subGroupId: number,
  event: string,
  data?: any
): Promise<{ success: boolean }> {
  return emitRealtimeEvent("subGroup", subGroupId, event, data);
}

/**
 * Émet un événement d'édition.
 */
export async function emitEditionEvent(
  editionId: number,
  event: string,
  data?: any
): Promise<{ success: boolean }> {
  return emitRealtimeEvent("edition", editionId, event, data);
}

/**
 * Émet un événement de lutteur.
 */
export async function emitFighterEvent(
  fighterId: number,
  event: string,
  data?: any
): Promise<{ success: boolean }> {
  return emitRealtimeEvent("fighter", fighterId, event, data);
}

/**
 * Émet un événement de région.
 */
export async function emitRegionEvent(
  regionId: number,
  event: string,
  data?: any
): Promise<{ success: boolean }> {
  return emitRealtimeEvent("region", regionId, event, data);
}

/**
 * Récupère les statistiques du système realtime Firestore.
 * Remplace l'ancien wsManager.getStats() (qui retournait les stats WebSocket).
 */
export async function getRealtimeStats() {
  return getRealtimeDBStats();
}

/**
 * Force la synchronisation d'un match avec Firestore.
 * Utile pour les cas de re-sync manuelle depuis l'interface admin.
 */
export async function forceSyncMatch(matchId: number): Promise<{ success: boolean; error?: string }> {
  try {
    await syncMatchRealtime(matchId, "force_sync");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Force la synchronisation d'un sous-groupe avec Firestore.
 */
export async function forceSyncSubGroup(subGroupId: number): Promise<{ success: boolean; error?: string }> {
  try {
    await syncSubGroupRealtime(subGroupId, "force_sync");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Supprime le document Firestore realtime correspondant à une entité.
 * Appelée lorsqu'une entité est supprimée dans PostgreSQL.
 */
export async function emitRealtimeDelete(
  entityType: EntityType,
  entityId: number | string,
  data?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const id = Number(entityId);

    switch (entityType) {
      case "match":
        if (data?.subGroupId || data?.sub_group_id) {
           await deleteRealtimeMatchDocument(id, data.subGroupId || data.sub_group_id);
        } else {
           console.warn(`[RTDB] Impossible de supprimer le match ${id} sans subGroupId dans les data.`);
        }
        break;

      case "subGroup":
        await deleteRealtimeSubGroupDocument(id);
        break;

      default:
        console.log(`[RTDB] Deletion of ${entityType}:${entityId} ignored/not implemented`);
    }

    return { success: true };
  } catch (error) {
    console.error("❌ emitRealtimeDelete error:", error);
    return { success: false, error: String(error) };
  }
}