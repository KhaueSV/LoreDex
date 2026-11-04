<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Prepara os diretórios no /tmp para o Laravel gravar cache, views e sessões
$dirs = [
    '/tmp/storage/framework/views',
    '/tmp/storage/framework/cache/data',
    '/tmp/storage/framework/sessions',
    '/tmp/storage/logs',
    '/tmp/storage/app/public',
];

foreach ($dirs as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
}

// Cria um arquivo sqlite temporário para não quebrar requisições iniciais sem MySQL
if (!file_exists('/tmp/database.sqlite')) {
    @touch('/tmp/database.sqlite');
}

// Carrega o autoloader do Composer
require __DIR__ . '/../vendor/autoload.php';

/** @var Application $app */
$app = require_once __DIR__ . '/../bootstrap/app.php';

// Redireciona o storage_path para o /tmp gravável da Vercel
$app->useStoragePath('/tmp/storage');

$app->handleRequest(Request::capture());
