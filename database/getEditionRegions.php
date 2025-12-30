<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

class EditionRegionsAPI {
    private $db;
    private $requestMethod;

    public function __construct($db, $requestMethod) {
        $this->db = $db;
        $this->requestMethod = $requestMethod;
    }

    public function processRequest() {
        switch ($this->requestMethod) {
            case 'GET':
                $this->getEditionRegions();
                break;
            default:
                $this->methodNotAllowed();
                break;
        }
    }

    private function getEditionRegions() {
        try {
            $editionId = isset($_GET['edition_id']) ? intval($_GET['edition_id']) : null;
            
            if (!$editionId) {
                $this->sendError('Le paramètre edition_id est requis', 400);
            }

            $response = $this->getCompleteEditionData($editionId);

            http_response_code(200);
            echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 500);
        }
    }

    private function getCompleteEditionData($editionId) {
        // Vérifier que l'édition existe
        $editionInfo = $this->getEditionInfo($editionId);
        if (!$editionInfo) {
            $this->sendError('Édition non trouvée', 404);
        }

        // Récupérer les régions participantes
        $regions = $this->getRegionsForEdition($editionId);
        
        // Récupérer les lutteurs de l'édition avec leurs statistiques
        $fighters = $this->getFightersForEdition($editionId);
        
        // Calculer les statistiques pour chaque région
        $regions = $this->calculateRegionStats($regions, $fighters);
        
        // Organiser les lutteurs invaincus
        $unbeatenFighters = $this->getUnbeatenFighters($fighters);
        
        // Calculer le classement des régions
        $regions = $this->rankRegions($regions);

        return [
            'success' => true,
            'data' => [
                'edition' => $editionInfo,
                'regions' => $regions,
                'fighters' => $fighters,
                'unbeatenFighters' => $unbeatenFighters,
                'summary' => [
                    'totalRegions' => count($regions),
                    'totalFighters' => count($fighters),
                    'unbeatenFighters' => count($unbeatenFighters),
                    'eliminatedRegions' => count(array_filter($regions, fn($r) => $r['is_eliminated'])),
                    'activeRegions' => count(array_filter($regions, fn($r) => !$r['is_eliminated']))
                ],
                'timestamp' => date('c')
            ],
            'message' => 'Données de l\'édition récupérées avec succès'
        ];
    }

    private function getEditionInfo($editionId) {
        $query = "SELECT 
                    e.id,
                    e.theme,
                    e.year,
                    e.start_date as startDate,
                    e.end_date as endDate,
                    e.is_active as isActive,
                    c.name as competitionName
                  FROM competition_editions e
                  JOIN competitions c ON e.competition_id = c.id
                  WHERE e.id = :edition_id";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':edition_id', $editionId, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    private function getRegionsForEdition($editionId) {
        $query = "SELECT 
                    re.id,
                    re.region_id as regionId,
                    r.name as regionName,
                    r.code as regionCode,
                    r.color as regionColor,
                    r.stadium_name as stadiumName,
                    re.points,
                    re.is_eliminated as is_eliminated,
                    re.created_at as createdAt
                  FROM edition_regions re
                  JOIN regions r ON re.region_id = r.id
                  WHERE re.edition_id = :edition_id
                  ORDER BY re.points DESC, r.name ASC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':edition_id', $editionId, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getFightersForEdition($editionId) {
        $query = "SELECT 
                    fe.id,
                    fe.fighter_id as fighterId,
                    f.first_name as firstName,
                    f.last_name as lastName,
                    f.nickname,
                    f.profile_image as profileImage,
                    f.height,
                    f.weight,
                    f.fighting_style as fightingStyle,
                    f.ranking,
                    f.region_id as regionId,
                    r.name as regionName,
                    r.color as regionColor,
                    fe.is_eliminated as is_eliminated,
                    fe.is_champion as is_champion,
                    fe.created_at as createdAt,
                    
                    -- Statistiques du lutteur dans cette édition
                    COALESCE(stats.total_matches, 0) as total_matches,
                    COALESCE(stats.wins, 0) as wins,
                    COALESCE(stats.losses, 0) as losses,
                    COALESCE(stats.terraces, 0) as terraces,
                    COALESCE(stats.been_terraced, 0) as been_terraced,
                    COALESCE(stats.yellow_cards, 0) as yellow_cards,
                    COALESCE(stats.red_cards, 0) as red_cards,
                    
                    -- Calcul des stats dérivées
                    CASE 
                        WHEN COALESCE(stats.total_matches, 0) > 0 
                        THEN ROUND((COALESCE(stats.wins, 0) * 100.0) / COALESCE(stats.total_matches, 0), 1)
                        ELSE 0 
                    END as win_rate,
                    
                    -- Nombre de matchs sans défaite (invaincu)
                    (COALESCE(stats.total_matches, 0) - COALESCE(stats.losses, 0)) as unbeaten_matches

                  FROM edition_fighters fe
                  JOIN fighters f ON fe.fighter_id = f.id
                  JOIN regions r ON f.region_id = r.id
                  LEFT JOIN (
                    SELECT 
                        m.fighter1_id as fighter_id,
                        COUNT(*) as total_matches,
                        SUM(CASE WHEN m.winner_fighter_id = m.fighter1_id THEN 1 ELSE 0 END) as wins,
                        SUM(CASE WHEN m.loser_fighter_id = m.fighter1_id THEN 1 ELSE 0 END) as losses,
                        SUM(CASE WHEN m.loser_fighter_id = m.fighter1_id AND m.match_result = 'terrace' THEN 1 ELSE 0 END) as terraces,
                        SUM(CASE WHEN m.loser_fighter_id = m.fighter1_id THEN 1 ELSE 0 END) as been_terraced,
                        SUM(CASE WHEN EXISTS (
                            SELECT 1 FROM fighter_cards fc 
                            WHERE fc.match_id = m.id AND fc.fighter_id = m.fighter1_id AND fc.card_type = 'yellow'
                        ) THEN 1 ELSE 0 END) as yellow_cards,
                        SUM(CASE WHEN EXISTS (
                            SELECT 1 FROM fighter_cards fc 
                            WHERE fc.match_id = m.id AND fc.fighter_id = m.fighter1_id AND fc.card_type = 'red'
                        ) THEN 1 ELSE 0 END) as red_cards
                    FROM matches m
                    JOIN sub_groups sg ON m.sub_group_id = sg.id
                    JOIN phase_groups pg ON sg.group_id = pg.id
                    JOIN phases p ON pg.phase_id = p.id
                    WHERE p.edition_id = :edition_id1
                    GROUP BY m.fighter1_id
                    
                    UNION ALL
                    
                    SELECT 
                        m.fighter2_id as fighter_id,
                        COUNT(*) as total_matches,
                        SUM(CASE WHEN m.winner_fighter_id = m.fighter2_id THEN 1 ELSE 0 END) as wins,
                        SUM(CASE WHEN m.loser_fighter_id = m.fighter2_id THEN 1 ELSE 0 END) as losses,
                        SUM(CASE WHEN m.loser_fighter_id = m.fighter2_id AND m.match_result = 'terrace' THEN 1 ELSE 0 END) as terraces,
                        SUM(CASE WHEN m.loser_fighter_id = m.fighter2_id THEN 1 ELSE 0 END) as been_terraced,
                        SUM(CASE WHEN EXISTS (
                            SELECT 1 FROM fighter_cards fc 
                            WHERE fc.match_id = m.id AND fc.fighter_id = m.fighter2_id AND fc.card_type = 'yellow'
                        ) THEN 1 ELSE 0 END) as yellow_cards,
                        SUM(CASE WHEN EXISTS (
                            SELECT 1 FROM fighter_cards fc 
                            WHERE fc.match_id = m.id AND fc.fighter_id = m.fighter2_id AND fc.card_type = 'red'
                        ) THEN 1 ELSE 0 END) as red_cards
                    FROM matches m
                    JOIN sub_groups sg ON m.sub_group_id = sg.id
                    JOIN phase_groups pg ON sg.group_id = pg.id
                    JOIN phases p ON pg.phase_id = p.id
                    WHERE p.edition_id = :edition_id2
                    GROUP BY m.fighter2_id
                  ) stats ON fe.fighter_id = stats.fighter_id
                  WHERE fe.edition_id = :edition_id3
                  ORDER BY 
                    fe.is_champion DESC,
                    fe.is_eliminated ASC,
                    stats.wins DESC,
                    stats.total_matches DESC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':edition_id1', $editionId, PDO::PARAM_INT);
        $stmt->bindParam(':edition_id2', $editionId, PDO::PARAM_INT);
        $stmt->bindParam(':edition_id3', $editionId, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function calculateRegionStats($regions, $fighters) {
        foreach ($regions as &$region) {
            $regionId = $region['regionId'];
            
            // Filtrer les lutteurs de cette région
            $regionFighters = array_filter($fighters, fn($f) => $f['regionId'] == $regionId);
            
            // Calculer les statistiques
            $totalFighters = count($regionFighters);
            $unbeatenFighters = count(array_filter($regionFighters, fn($f) => $f['losses'] == 0));
            $eliminatedFighters = count(array_filter($regionFighters, fn($f) => $f['is_eliminated']));
            $championFighters = count(array_filter($regionFighters, fn($f) => $f['is_champion']));
            
            $totalWins = array_sum(array_column($regionFighters, 'wins'));
            $totalLosses = array_sum(array_column($regionFighters, 'losses'));
            $totalTerraces = array_sum(array_column($regionFighters, 'terraces'));
            $totalBeenTerraced = array_sum(array_column($regionFighters, 'been_terraced'));
            
            // Ajouter les statistiques calculées
            $region['stats'] = [
                'total_fighters' => $totalFighters,
                'unbeaten_fighters' => $unbeatenFighters,
                'eliminated_fighters' => $eliminatedFighters,
                'champion_fighters' => $championFighters,
                'total_wins' => $totalWins,
                'total_losses' => $totalLosses,
                'total_terraces' => $totalTerraces,
                'total_been_terraced' => $totalBeenTerraced,
                'win_rate' => $totalWins + $totalLosses > 0 
                    ? round(($totalWins * 100) / ($totalWins + $totalLosses), 1) 
                    : 0
            ];
            
            // Calculer le ratio de lutteurs invaincus
            $region['unbeaten_ratio'] = $totalFighters > 0 
                ? round(($unbeatenFighters * 100) / $totalFighters, 1) 
                : 0;
        }
        
        return $regions;
    }

    private function getUnbeatenFighters($fighters) {
        $unbeaten = array_filter($fighters, fn($f) => $f['losses'] == 0);
        
        // Trier par nombre de terraces (x0 à x7)
        usort($unbeaten, function($a, $b) {
            // Priorité: champion > nombre de terraces > nombre de matchs > win rate
            if ($a['is_champion'] != $b['is_champion']) {
                return $b['is_champion'] - $a['is_champion'];
            }
            if ($a['terraces'] != $b['terraces']) {
                return $b['terraces'] - $a['terraces'];
            }
            if ($a['total_matches'] != $b['total_matches']) {
                return $b['total_matches'] - $a['total_matches'];
            }
            return $b['win_rate'] - $a['win_rate'];
        });
        
        return array_values($unbeaten);
    }

    private function rankRegions($regions) {
        // Trier les régions selon plusieurs critères
        usort($regions, function($a, $b) {
            // Priorité: éliminé ou non
            if ($a['is_eliminated'] != $b['is_eliminated']) {
                return $a['is_eliminated'] - $b['is_eliminated']; // Non éliminé d'abord
            }
            
            // Points totaux
            if ($a['points'] != $b['points']) {
                return $b['points'] - $a['points'];
            }
            
            // Nombre de lutteurs invaincus
            if ($a['stats']['unbeaten_fighters'] != $b['stats']['unbeaten_fighters']) {
                return $b['stats']['unbeaten_fighters'] - $a['stats']['unbeaten_fighters'];
            }
            
            // Ratio de lutteurs invaincus
            if ($a['unbeaten_ratio'] != $b['unbeaten_ratio']) {
                return $b['unbeaten_ratio'] - $a['unbeaten_ratio'];
            }
            
            // Nombre de victoires total
            if ($a['stats']['total_wins'] != $b['stats']['total_wins']) {
                return $b['stats']['total_wins'] - $a['stats']['total_wins'];
            }
            
            // Nombre de terraces
            if ($a['stats']['total_terraces'] != $b['stats']['total_terraces']) {
                return $b['stats']['total_terraces'] - $a['stats']['total_terraces'];
            }
            
            // Nombre de champions
            return $b['stats']['champion_fighters'] - $a['stats']['champion_fighters'];
        });
        
        // Ajouter le rang
        foreach ($regions as $index => &$region) {
            $region['rank'] = $index + 1;
        }
        
        return $regions;
    }

    private function methodNotAllowed() {
        $this->sendError('Méthode non autorisée', 405);
    }

    private function sendError($message, $statusCode = 400) {
        http_response_code($statusCode);
        echo json_encode([
            'success' => false,
            'error' => [
                'code' => $statusCode,
                'message' => $message,
                'timestamp' => date('c')
            ]
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit();
    }
}

// Configuration et initialisation
try {
    $requestMethod = $_SERVER['REQUEST_METHOD'];
    $api = new EditionRegionsAPI($pdo, $requestMethod);
    $api->processRequest();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => 500,
            'message' => 'Erreur serveur interne',
            'timestamp' => date('c')
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>