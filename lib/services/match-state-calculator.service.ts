// lib/services/match-state-calculator.service.ts
import { PoolClient } from 'pg';

export interface MatchState {
    sub_group: {
        score_region1: number;
        score_region2: number;
        nulls: number;
    };
    region1_id: number;
    region2_id: number;
    edition_regions: Map<number, { points: number; is_eliminated: boolean }>;
    edition_fighters: Map<number, { is_eliminated: boolean }>;
}

export class MatchStateCalculator {
    /**
     * Calcule l'état complet à partir des matchs terminés d'un sous-groupe
     */
    static async calculateState(
        client: PoolClient,
        subGroupId: number,
        excludeMatchId?: number // Pour ignorer le match en cours lors d'un reset
    ): Promise<MatchState> {
        // 1. Récupérer les infos de base du sous-groupe
        const subGroupRes = await client.query(
            `SELECT sg.region1_id, sg.region2_id, p.edition_id
       FROM sub_groups sg
       JOIN phase_groups pg ON sg.group_id = pg.id
       JOIN phases p ON pg.phase_id = p.id
       WHERE sg.id = $1`,
            [subGroupId]
        );

        if (!subGroupRes.rowCount) {
            throw new Error('Sous-groupe non trouvé');
        }

        const { region1_id, region2_id, edition_id } = subGroupRes.rows[0];

        // 2. Récupérer tous les matchs terminés du sous-groupe (sauf celui exclu)
        const matchesRes = await client.query(
            `SELECT 
         m.winner_fighter_id,
         m.loser_fighter_id,
         m.match_result,
         m.fighter1_id,
         m.fighter2_id
       FROM matches m
       WHERE m.sub_group_id = $1
         AND m.status = 'completed'
         AND m.is_active = true
         ${excludeMatchId ? 'AND m.id != $2' : ''}`,
            excludeMatchId ? [subGroupId, excludeMatchId] : [subGroupId]
        );

        // 3. Initialiser l'état
        const state: MatchState = {
            sub_group: {
                score_region1: 0,
                score_region2: 0,
                nulls: 0
            },
            region1_id,
            region2_id,
            edition_regions: new Map(),
            edition_fighters: new Map()
        };

        // Initialiser les régions avec 0 points
        state.edition_regions.set(region1_id, { points: 0, is_eliminated: false });
        state.edition_regions.set(region2_id, { points: 0, is_eliminated: false });

        // 4. Traiter chaque match
        for (const match of matchesRes.rows) {
            await this.applyMatchToState(client, state, match, edition_id);
        }

        return state;
    }

    /**
     * Applique l'impact d'un match à l'état
     */
    private static async applyMatchToState(
        client: PoolClient,
        state: MatchState,
        match: any,
        editionId: number
    ) {
        // Match nul
        if (match.match_result === 'draw') {
            state.sub_group.nulls += 1;

            // +1 point pour chaque région
            for (const [regionId, regionState] of state.edition_regions) {
                regionState.points += 1;
            }

            // Marquer les deux fighters comme éliminés
            if (match.fighter1_id) {
                state.edition_fighters.set(match.fighter1_id, { is_eliminated: true });
            }
            if (match.fighter2_id) {
                state.edition_fighters.set(match.fighter2_id, { is_eliminated: true });
            }

            return;
        }

        // Victoire
        if (match.winner_fighter_id) {
            // Récupérer la région du vainqueur
            const winnerRes = await client.query(
                `SELECT region_id FROM fighters WHERE id = $1`,
                [match.winner_fighter_id]
            );

            if (winnerRes.rowCount) {
                const winnerRegionId = winnerRes.rows[0].region_id;
                const loserRegionId = winnerRegionId === state.region1_id ? state.region2_id : state.region1_id;

                // Mettre à jour les scores du sous-groupe
                if (winnerRegionId === state.region1_id) {
                    state.sub_group.score_region1 += 1;
                } else {
                    state.sub_group.score_region2 += 1;
                }

                // Mettre à jour les points de la région dans l'édition
                const regionState = state.edition_regions.get(winnerRegionId);
                if (regionState) {
                    regionState.points += 3;
                }

                // Marquer le vaincu comme éliminé
                if (match.loser_fighter_id) {
                    state.edition_fighters.set(match.loser_fighter_id, { is_eliminated: true });
                }
            }
        }
    }

    /**
     * Synchronise l'état calculé avec la base de données
     */
    static async syncState(
        client: PoolClient,
        subGroupId: number,
        calculatedState: MatchState
    ) {
        // 1. Mettre à jour le sous-groupe
        await client.query(
            `UPDATE sub_groups
       SET score_region1 = $1,
           score_region2 = $2,
           nulls = $3
       WHERE id = $4`,
            [
                calculatedState.sub_group.score_region1,
                calculatedState.sub_group.score_region2,
                calculatedState.sub_group.nulls,
                subGroupId
            ]
        );

        // 2. Mettre à jour edition_regions
        for (const [regionId, regionState] of calculatedState.edition_regions) {
            await client.query(
                `UPDATE edition_regions
         SET points = $1,
             is_eliminated = $2
         WHERE edition_id = (
           SELECT p.edition_id
           FROM sub_groups sg
           JOIN phase_groups pg ON sg.group_id = pg.id
           JOIN phases p ON pg.phase_id = p.id
           WHERE sg.id = $3
         ) AND region_id = $4`,
                [regionState.points, regionState.is_eliminated, subGroupId, regionId]
            );
        }

        // 3. Mettre à jour edition_fighters
        for (const [fighterId, fighterState] of calculatedState.edition_fighters) {
            await client.query(
                `UPDATE edition_fighters
         SET is_eliminated = $1
         WHERE edition_id = (
           SELECT p.edition_id
           FROM sub_groups sg
           JOIN phase_groups pg ON sg.group_id = pg.id
           JOIN phases p ON pg.phase_id = p.id
           WHERE sg.id = $2
         ) AND fighter_id = $3`,
                [fighterState.is_eliminated, subGroupId, fighterId]
            );
        }
    }
}