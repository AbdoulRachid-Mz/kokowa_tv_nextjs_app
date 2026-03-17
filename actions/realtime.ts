// actions/realtime.ts
'use server';

import { wsManager } from '@/server/ws-connection-manager';
import { RealtimeUpdatePayload } from '@/server/ws-types';
import { revalidatePath } from 'next/cache';

/**
 * Émet un événement temps réel via WebSocket (Nouveau Système)
 */
export async function emitRealtimeEvent(
    entityType: 'edition' | 'subGroup' | 'match' | 'fighter' | 'region',
    entityId: number | string,
    event: string,
    data: any
) {
    try {
        const payload: RealtimeUpdatePayload = {
            entityType: entityType as any,
            entityId,
            event,
            data,
            timestamp: Date.now()
        };

        // Utiliser le nouveau wsManager pour diffuser
        wsManager.broadcastToEntity(payload);

        return { success: true };
    } catch (error) {
        console.error('❌ Erreur émission événement:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Émet un événement de match
 */
export async function emitMatchEvent(matchId: number, event: string, data: any) {
    return emitRealtimeEvent('match', matchId, event, data);
}

/**
 * Émet un événement de sous-groupe
 */
export async function emitSubGroupEvent(subGroupId: number, event: string, data: any) {
    return emitRealtimeEvent('subGroup', subGroupId, event, data);
}

/**
 * Émet un événement d'édition
 */
export async function emitEditionEvent(editionId: number, event: string, data: any) {
    return emitRealtimeEvent('edition', editionId, event, data);
}

/**
 * Émet un événement de lutteur
 */
export async function emitFighterEvent(fighterId: number, event: string, data: any) {
    return emitRealtimeEvent('fighter', fighterId, event, data);
}

/**
 * Émet un événement de région
 */
export async function emitRegionEvent(regionId: number, event: string, data: any) {
    return emitRealtimeEvent('region', regionId, event, data);
}

/**
 * Récupère les statistiques du serveur WebSocket
 */
export async function getRealtimeStats() {
    return wsManager.getStats();
}