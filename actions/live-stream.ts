"use server";

// actions/live-stream.ts
// Direct vidéo d'une édition (YouTube Live, Facebook Live...).
// - Base de données : competition_editions.live_url / live_title / live_started_at
// - Temps réel : Firebase RTDB editions/{id}/liveUrl (écouté par l'app mobile,
//   qui affiche alors le bouton flottant « Regarder en direct »)
// - Notification : catégorie « live » (respecte les choix de l'utilisateur)

import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db/neon-client";
import { hasAnyRole } from "@/lib/auth";
import { getAdminRTDB } from "@/lib/realtime/rtdb-admin";
import { REALTIME_NODES } from "@/types/realtime";
import { sendPushToCategory } from "@/lib/push";

export interface EditionLiveStream {
  editionId: number;
  liveUrl: string | null;
  liveTitle: string | null;
  liveStartedAt: string | null;
}

type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

/** Rôles autorisés à lancer ou arrêter un direct. */
const LIVE_ROLES = ["admin", "editor"];

/** Hébergeurs vidéo acceptés pour un direct. */
const ALLOWED_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "facebook.com",
  "www.facebook.com",
  "fb.watch",
];

/** Vérifie le lien et le normalise (https, hébergeur connu). */
function validateLiveUrl(raw: string): { ok: true; url: string } | { ok: false; error: string } {
  const value = raw.trim();
  if (!value) return { ok: false, error: "Collez le lien du direct." };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: "Lien invalide. Exemple : https://www.youtube.com/live/XXXXXXXXXXX" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: "Le lien doit commencer par https://" };
  }
  if (!ALLOWED_HOSTS.includes(url.hostname.toLowerCase())) {
    return { ok: false, error: "Seuls les directs YouTube ou Facebook sont acceptés." };
  }
  url.protocol = "https:";
  return { ok: true, url: url.toString() };
}

async function assertCanManageLive(): Promise<void> {
  if (!(await hasAnyRole(LIVE_ROLES))) {
    throw new Error("Accès refusé : seuls les administrateurs et éditeurs peuvent gérer le direct.");
  }
}

/** Nœud global des directs en cours : l'app l'écoute pour afficher le bouton
 *  « DIRECT » clignotant dans la barre de titre, quel que soit l'écran. */
const LIVE_NODE = "live";

function rtdbLivePaths(editionId: number) {
  const base = `${REALTIME_NODES.EDITIONS}/${editionId}`;
  return { url: `${base}/liveUrl`, info: `${base}/liveStream`, global: `${LIVE_NODE}/${editionId}` };
}

/** Lit l'état du direct d'une édition (lecture publique). */
export async function getEditionLiveStream(editionId: number): Promise<EditionLiveStream | null> {
  if (!Number.isInteger(editionId) || editionId <= 0) return null;
  let row: { live_url: string | null; live_title: string | null; live_started_at: string | null } | null;
  try {
    row = await queryOne(
      `SELECT live_url, live_title, live_started_at FROM competition_editions WHERE id = $1`,
      [editionId],
    );
  } catch (error) {
    // Colonnes absentes tant que la migration 012 n'est pas appliquée :
    // on considère qu'il n'y a pas de direct plutôt que de casser l'API mobile.
    console.error("getEditionLiveStream: migration 012 appliquée ?", error);
    return null;
  }
  if (!row) return null;
  return {
    editionId,
    liveUrl: row.live_url,
    liveTitle: row.live_title,
    liveStartedAt: row.live_started_at ? new Date(row.live_started_at).toISOString() : null,
  };
}

/** Lance (ou remplace) le direct vidéo d'une édition. */
export async function startEditionLive(
  editionId: number,
  rawUrl: string,
  title?: string,
  notify = true,
): Promise<ActionResult<EditionLiveStream>> {
  try {
    await assertCanManageLive();
    if (!Number.isInteger(editionId) || editionId <= 0) {
      return { success: false, error: "Édition invalide." };
    }
    const check = validateLiveUrl(rawUrl);
    if (!check.ok) return { success: false, error: check.error };

    const liveTitle = title?.trim().slice(0, 255) || null;
    const startedAt = new Date().toISOString();

    const updated = await query(
      `UPDATE competition_editions
          SET live_url = $1, live_title = $2, live_started_at = $3
        WHERE id = $4
      RETURNING id`,
      [check.url, liveTitle, startedAt, editionId],
    );
    if (updated.length === 0) return { success: false, error: "Édition introuvable." };

    // Publication temps réel : l'app mobile affiche le bouton « Regarder en direct »
    const db = getAdminRTDB();
    const paths = rtdbLivePaths(editionId);
    await Promise.all([
      db.ref(paths.url).set(check.url),
      db.ref(paths.info).set({ url: check.url, title: liveTitle, startedAt, isLive: true }),
      db.ref(paths.global).set({ editionId, url: check.url, title: liveTitle, startedAt }),
    ]);

    if (notify) {
      await sendPushToCategory(
        "live",
        "🔴 Kokowa TV en direct",
        liveTitle || "Le direct vient de commencer : regardez les combats en direct !",
        // `url` : l'app ouvre directement le lecteur du direct au toucher
        { editionId: editionId.toString(), route: `edition/${editionId}/live`, url: check.url },
      );
    }

    revalidatePath(`/ad/editions/${editionId}`);
    return {
      success: true,
      data: { editionId, liveUrl: check.url, liveTitle, liveStartedAt: startedAt },
      message: "Direct lancé",
    };
  } catch (error) {
    console.error("startEditionLive error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur serveur" };
  }
}

/** Arrête le direct vidéo d'une édition (le bouton disparaît de l'app). */
export async function stopEditionLive(editionId: number): Promise<ActionResult> {
  try {
    await assertCanManageLive();
    if (!Number.isInteger(editionId) || editionId <= 0) {
      return { success: false, error: "Édition invalide." };
    }
    await query(
      `UPDATE competition_editions
          SET live_url = NULL, live_title = NULL, live_started_at = NULL
        WHERE id = $1`,
      [editionId],
    );
    const db = getAdminRTDB();
    const paths = rtdbLivePaths(editionId);
    await Promise.all([
      db.ref(paths.url).remove(),
      db.ref(paths.info).remove(),
      db.ref(paths.global).remove(),
    ]);

    revalidatePath(`/ad/editions/${editionId}`);
    return { success: true, message: "Direct arrêté" };
  } catch (error) {
    console.error("stopEditionLive error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur serveur" };
  }
}
