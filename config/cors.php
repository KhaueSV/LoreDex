<?php

return [
    'paths' => ['api/*'],

    // Só os verbos que a API realmente usa
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => [
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],
    'allowed_origins_patterns' => [],

    // Só os cabeçalhos que o front envia
    'allowed_headers' => ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],

    'exposed_headers' => [],
    'max_age' => 3600,
    'supports_credentials' => false,
];