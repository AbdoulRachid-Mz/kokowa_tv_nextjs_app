<?php

function getAccessToken() {

    $serviceAccount = json_decode(
        file_get_contents('service-account.json'),
        true
    );

    $header = [
        "alg" => "RS256",
        "typ" => "JWT"
    ];

    $now = time();

    $payload = [
        "iss" => $serviceAccount['client_email'],
        "scope" => "https://www.googleapis.com/auth/firebase.messaging",
        "aud" => "https://oauth2.googleapis.com/token",
        "iat" => $now,
        "exp" => $now + 3600
    ];

    $base64UrlHeader = str_replace(
        ['+', '/', '='],
        ['-', '_', ''],
        base64_encode(json_encode($header))
    );

    $base64UrlPayload = str_replace(
        ['+', '/', '='],
        ['-', '_', ''],
        base64_encode(json_encode($payload))
    );

    $signature = '';
    openssl_sign(
        $base64UrlHeader . "." . $base64UrlPayload,
        $signature,
        $serviceAccount['private_key'],
        'SHA256'
    );

    $base64UrlSignature = str_replace(
        ['+', '/', '='],
        ['-', '_', ''],
        base64_encode($signature)
    );

    $jwt = $base64UrlHeader . "." .
           $base64UrlPayload . "." .
           $base64UrlSignature;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://oauth2.googleapis.com/token");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        "grant_type" => "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion" => $jwt
    ]));

    $response = json_decode(curl_exec($ch), true);
    curl_close($ch);

    return $response['access_token'];
}

function sendNotification() {

    $accessToken = getAccessToken();

    $projectId = "kokowa-tv";

    $message = [
        "message" => [
            "topic" => "global",
            "notification" => [
                "title" => "Match en direct 🔥",
                "body" => "Le combat vient de commencer !"
            ],
            "data" => [
                "route" => "match/45",
                "matchId" => "45"
            ]
        ]
    ];

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL,
        "https://fcm.googleapis.com/v1/projects/$projectId/messages:send"
    );

    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $accessToken",
        "Content-Type: application/json"
    ]);

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($message));

    $response = curl_exec($ch);
    curl_close($ch);

    return $response;
}

echo sendNotification();