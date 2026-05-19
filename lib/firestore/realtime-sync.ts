// lib/firestore/realtime-sync.ts
// Service principal de synchronisation Firestore
// SERVER-SIDE ONLY — utilisé dans les Server Actions et API Routes
//
// Philosophie :
//   PostgreSQL → source de vérité (transactions, calculs, relations)
//   Firestore  → couche realtime (cache live, onSnapshot frontend)
//
// Usage typique (après un COMMIT PostgreSQL) :
//   await syncMatchRealtime(matchId, 'match_updated');

import { getAdminFirestore } from "./admin-firestore";
import {
  buildRealtimeMatchDocument,
  buildRealtimeSubGroupMatchDocument,
} from "./builders/match-builder";
import { buildRealtimeSubGroupDocument } from "./builders/subgroup-builder";
import { REALTIME_COLLECTIONS, SUBGROUP_MATCHES_SUBCOLLECTION } from "@/types/realtime";
import type {
  RealtimeMatchDocument,
  RealtimeSubGroupDocument,
} from "@/types/realtime";

// ─── Helpers internes ────────────────────────────────────────────────────────

/**
 * Écrit ou met à jour partiellement un document Firestore.
 * Utilise `set + merge: true` pour n'écraser que les champs fournis.
 */
async function upsertDocument(
  collection: string,
  docId: string,
  data: Record<string, any>
): Promise<void> {
  const db = getAdminFirestore();
  const docRef = db.collection(collection).doc(docId);
  await docRef.set(data, { merge: true });
}

/**
 * Lit un document Firestore et retourne ses données ou null.
 */
async function getDocument<T>(
  collection: string,
  docId: string
): Promise<T | null> {
  const db = getAdminFirestore();
  const snap = await db.collection(collection).doc(docId).get();
  return snap.exists ? (snap.data() as T) : null;
}

// ─── API publique ────────────────────────────────────────────────────────────

/**
 * Synchronise le document Firestore d'un match depuis PostgreSQL.
 *
 * Comportement :
 * - Si le document n'existe pas → le crée complet
 * - Si le document existe → merge les nouveaux champs
 *
 * @param matchId  ID PostgreSQL du match
 * @param event    Nom de l'événement déclencheur (ex: 'match_updated', 'match_started')
 */
/**
 * Synchronise le document Firestore d'un match depuis PostgreSQL.
 *
 * Comportement :
 * - Si le document n'existe pas → le crée complet dans realtime_matches
 * - Si le document existe → merge les nouveaux champs
 * - Écrit également une copie légère dans la sous-collection `matches` du subGroup correspondant.
 *
 * @param matchId  ID PostgreSQL du match
 * @param event    Nom de l'événement déclencheur (ex: 'match_updated', 'match_started')
 */
export async function syncMatchRealtime(
  matchId: number,
  event?: string
): Promise<void> {
  try {
    // 1. Construire le document depuis PostgreSQL
    const doc = await buildRealtimeMatchDocument(matchId);

    // 2. Enrichir avec l'événement déclencheur
    const now = Date.now();
    const payload: RealtimeMatchDocument = {
      ...doc,
      updatedAt: now,
      realtime: {
        lastEvent: event,
        lastEventAt: event ? now : undefined,
      },
    };

    // 3. Écriture Firestore dans realtime_matches (merge = pas d'overwrite complet)
    await upsertDocument(
      REALTIME_COLLECTIONS.MATCHES,
      String(matchId),
      payload
    );

    console.log(
      `✅ Firestore sync: match ${matchId} | event: ${event ?? "none"} | live: ${payload.liveState.isLive}`
    );

    // 4. Écriture dans la sous-collection du subgroup
    if (payload.subGroup?.id) {
      await syncMatchInSubGroupRealcollection(payload.subGroup.id, matchId, payload, event);
    }
  } catch (error) {
    // Non-blocking : log l'erreur mais ne bloque pas la transaction PostgreSQL
    console.error(`❌ Firestore sync failed for match ${matchId}:`, error);
    // On ne throw pas pour ne pas rollback la transaction PG
  }
}

/**
 * Synchronise un match dans la sous-collection `matches` d'un subgroup.
 */
export async function syncMatchInSubGroupRealcollection(
  subGroupId: number,
  matchId: number,
  matchDoc?: RealtimeMatchDocument,
  event?: string
): Promise<void> {
  try {
    const db = getAdminFirestore();
    const subDocRef = db
      .collection(REALTIME_COLLECTIONS.SUBGROUPS)
      .doc(String(subGroupId))
      .collection(SUBGROUP_MATCHES_SUBCOLLECTION)
      .doc(String(matchId));

    let payload;
    if (matchDoc) {
      payload = {
        id: matchDoc.id,
        match_number: matchDoc.match.match_number,
        status: matchDoc.liveState.status,
        match_result: matchDoc.match.match_result,
        fighter1_id: matchDoc.fighters.fighter1.id,
        fighter2_id: matchDoc.fighters.fighter2.id,
        winner_fighter_id: matchDoc.match.winner_fighter_id,
        loser_fighter_id: matchDoc.match.loser_fighter_id,
        fighters: matchDoc.fighters,
        cards: matchDoc.cards,
        liveState: matchDoc.liveState,
        updatedAt: matchDoc.updatedAt,
      };
    } else {
      payload = await buildRealtimeSubGroupMatchDocument(matchId);
    }

    await subDocRef.set(payload, { merge: true });

    console.log(
      `✅ Firestore sub-collection sync: subGroup ${subGroupId}/matches/${matchId} | event: ${event ?? "none"}`
    );
  } catch (error) {
    console.error(
      `❌ Firestore sub-collection sync failed for subGroup ${subGroupId}/matches/${matchId}:`,
      error
    );
  }
}

/**
 * Synchronise le document Firestore d'un sous-groupe depuis PostgreSQL.
 */
export async function syncSubGroupRealtime(
  subGroupId: number,
  event?: string
): Promise<void> {
  try {
    const doc = await buildRealtimeSubGroupDocument(subGroupId);

    const now = Date.now();
    const payload: RealtimeSubGroupDocument = {
      ...doc,
      updatedAt: now,
      realtime: {
        lastEvent: event,
        lastEventAt: event ? now : undefined,
      },
    };

    await upsertDocument(
      REALTIME_COLLECTIONS.SUBGROUPS,
      String(subGroupId),
      payload
    );

    console.log(
      `✅ Firestore sync: subGroup ${subGroupId} | event: ${event ?? "none"}`
    );
  } catch (error) {
    console.error(
      `❌ Firestore sync failed for subGroup ${subGroupId}:`,
      error
    );
  }
}

/**
 * S'assure qu'un document match existe dans Firestore.
 * Si absent → le crée. Si présent → ne fait rien.
 * Utile au démarrage d'un match live.
 */
export async function ensureRealtimeMatchDocument(
  matchId: number
): Promise<void> {
  const existing = await getDocument<RealtimeMatchDocument>(
    REALTIME_COLLECTIONS.MATCHES,
    String(matchId)
  );

  if (!existing) {
    console.log(
      `📄 Firestore: document match ${matchId} inexistant → création`
    );
    await syncMatchRealtime(matchId, "document_created");
  } else {
    console.log(`📄 Firestore: document match ${matchId} existe déjà`);
  }
}

/**
 * S'assure qu'un document subGroup existe dans Firestore.
 */
export async function ensureRealtimeSubGroupDocument(
  subGroupId: number
): Promise<void> {
  const existing = await getDocument<RealtimeSubGroupDocument>(
    REALTIME_COLLECTIONS.SUBGROUPS,
    String(subGroupId)
  );

  if (!existing) {
    console.log(
      `📄 Firestore: document subGroup ${subGroupId} inexistant → création`
    );
    await syncSubGroupRealtime(subGroupId, "document_created");
  }
}

/**
 * Supprime un document match de Firestore (collection principale + sous-collection du subGroup).
 * À utiliser quand un match est supprimé définitivement.
 */
export async function deleteRealtimeMatchDocument(
  matchId: number
): Promise<void> {
  try {
    const db = getAdminFirestore();

    // 1. Essayer de récupérer le subGroupId depuis le document existant dans Firestore
    const existing = await getDocument<RealtimeMatchDocument>(
      REALTIME_COLLECTIONS.MATCHES,
      String(matchId)
    );
    const subGroupId = existing?.subGroup?.id;

    // 2. Supprimer de la sous-collection du subgroup si trouvé
    if (subGroupId) {
      await db
        .collection(REALTIME_COLLECTIONS.SUBGROUPS)
        .doc(String(subGroupId))
        .collection(SUBGROUP_MATCHES_SUBCOLLECTION)
        .doc(String(matchId))
        .delete();
      console.log(`🗑️ Firestore: sub-collection match ${subGroupId}/matches/${matchId} supprimé`);
    }

    // 3. Supprimer le document principal
    await db
      .collection(REALTIME_COLLECTIONS.MATCHES)
      .doc(String(matchId))
      .delete();
    console.log(`🗑️ Firestore: document match ${matchId} supprimé`);
  } catch (error) {
    console.error(
      `❌ Firestore delete failed for match ${matchId}:`,
      error
    );
  }
}

/**
 * Supprime un document subGroup de Firestore et nettoie récursivement sa sous-collection `matches`.
 */
export async function deleteRealtimeSubGroupDocument(
  subGroupId: number
): Promise<void> {
  try {
    const db = getAdminFirestore();
    const subGroupRef = db.collection(REALTIME_COLLECTIONS.SUBGROUPS).doc(String(subGroupId));

    // 1. Supprimer tous les documents de la sous-collection matches
    const matchesSnapshot = await subGroupRef.collection(SUBGROUP_MATCHES_SUBCOLLECTION).get();
    if (!matchesSnapshot.empty) {
      const batch = db.batch();
      matchesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`🗑️ Firestore: sous-collection matches de subGroup ${subGroupId} nettoyée (${matchesSnapshot.size} matches)`);
    }

    // 2. Supprimer le document subgroup parent
    await subGroupRef.delete();
    console.log(`🗑️ Firestore: document subGroup ${subGroupId} supprimé`);
  } catch (error) {
    console.error(
      `❌ Firestore delete failed for subGroup ${subGroupId}:`,
      error
    );
  }
}

/**
 * Met à jour uniquement le liveState d'un match (optimisation coût Firestore).
 * Évite de rebuilder tout le document pour un simple changement de statut.
 *
 * @param matchId   ID du match
 * @param isLive    Nouveau statut live
 * @param status    Nouveau statut du match
 * @param event     Nom de l'événement
 */
export async function updateMatchLiveState(
  matchId: number,
  isLive: boolean,
  status: string,
  event?: string
): Promise<void> {
  try {
    const now = Date.now();
    await upsertDocument(
      REALTIME_COLLECTIONS.MATCHES,
      String(matchId),
      {
        "liveState.isLive": isLive,
        "liveState.status": status,
        updatedAt: now,
        "realtime.lastEvent": event,
        "realtime.lastEventAt": now,
      }
    );
  } catch (error) {
    console.error(
      `❌ Firestore updateMatchLiveState failed for match ${matchId}:`,
      error
    );
  }
}

/**
 * Récupère les stats de monitoring Firestore (nb de docs par collection).
 * Utilisé par la page /ad/realtime pour le monitoring.
 */
export async function getFirestoreRealtimeStats(): Promise<{
  liveMatches: number;
  totalMatchDocs: number;
  totalSubGroupDocs: number;
  firestoreConnected: boolean;
}> {
  try {
    const db = getAdminFirestore();

    const [matchesSnap, subGroupsSnap, liveSnap] = await Promise.all([
      db.collection(REALTIME_COLLECTIONS.MATCHES).count().get(),
      db.collection(REALTIME_COLLECTIONS.SUBGROUPS).count().get(),
      db
        .collection(REALTIME_COLLECTIONS.MATCHES)
        .where("liveState.isLive", "==", true)
        .count()
        .get(),
    ]);

    return {
      liveMatches: liveSnap.data().count,
      totalMatchDocs: matchesSnap.data().count,
      totalSubGroupDocs: subGroupsSnap.data().count,
      firestoreConnected: true,
    };
  } catch (error) {
    console.error("❌ Firestore getStats failed:", error);
    return {
      liveMatches: 0,
      totalMatchDocs: 0,
      totalSubGroupDocs: 0,
      firestoreConnected: false,
    };
  }
}
