<?php
// api/team/list.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

try {

$db = new PDO("mysql:host=localhost;dbname=test;charset=utf8","root","");
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$response = [
    'success' => true,
    'data' => [
        'members' => [],
        'summary' => []
    ],
    'message' => 'Équipe récupérée avec succès'
];

$sql = "
SELECT 
    tm.*,
    CONCAT(
        '[',
        GROUP_CONCAT(
            IF(ta.id IS NOT NULL,
                JSON_OBJECT(
                    'id', ta.id,
                    'title', ta.title,
                    'description', ta.description,
                    'achievement_date', ta.achievement_date,
                    'category', ta.category,
                    'icon', ta.icon,
                    'color', ta.color
                ),
                NULL
            )
        ),
        ']'
    ) as achievements
FROM team_members tm
LEFT JOIN team_achievements ta 
    ON tm.id = ta.team_member_id
WHERE tm.is_active = TRUE
GROUP BY tm.id
ORDER BY tm.position_order ASC, tm.joined_date ASC
";

$stmt = $db->query($sql);
$members = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($members as &$member) {

    $member['social_links'] = json_decode($member['social_links'], true);
    $member['badges'] = json_decode($member['badges'], true);
    $member['expertise'] = json_decode($member['expertise'], true);
    $member['languages'] = json_decode($member['languages'], true);
    $member['achievements'] = json_decode($member['achievements'], true);

    $member['joined_date'] = date('Y-m-d', strtotime($member['joined_date']));
    $member['created_at'] = date('c', strtotime($member['created_at']));

    $member['updated_at'] = $member['updated_at']
        ? date('c', strtotime($member['updated_at']))
        : null;

    $member['last_active'] = $member['last_active']
        ? date('c', strtotime($member['last_active']))
        : null;

    $member = array_filter($member, function($value) {
        return $value !== null;
    });
}

$statsSql = "
SELECT 
    COUNT(*) as total_members,
    SUM(CASE WHEN is_lead = TRUE THEN 1 ELSE 0 END) as total_leads,
    SUM(CASE WHEN role LIKE '%Développeur%' OR role LIKE '%Developer%' THEN 1 ELSE 0 END) as total_developers,
    SUM(CASE WHEN role LIKE '%Design%' THEN 1 ELSE 0 END) as total_designers,
    SUM(CASE WHEN role LIKE '%Projet%' OR role LIKE '%Manager%' THEN 1 ELSE 0 END) as total_managers,
    SUM(years_experience) as total_experience,
    SUM(projects_count) as total_projects,
    SUM(contributions_count) as total_contributions
FROM team_members
WHERE is_active = TRUE
";

$statsStmt = $db->query($statsSql);
$stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

$response['data']['members'] = $members;
$response['data']['summary'] = [
    'total' => (int)$stats['total_members'],
    'leads' => (int)$stats['total_leads'],
    'developers' => (int)$stats['total_developers'],
    'designers' => (int)$stats['total_designers'],
    'managers' => (int)$stats['total_managers'],
    'total_experience' => (int)$stats['total_experience'],
    'total_projects' => (int)$stats['total_projects'],
    'total_contributions' => (int)$stats['total_contributions']
];

http_response_code(200);
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {

http_response_code(500);
echo json_encode([
    'success' => false,
    'message' => 'Erreur serveur: '.$e->getMessage(),
    'data' => null
]);

}
?>


