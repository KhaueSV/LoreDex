<?php

// Prepara os diretórios no /tmp para o Laravel gravar cache e views na Vercel
$dirs = [
    '/tmp/storage/framework/views',
    '/tmp/storage/framework/cache/data',
    '/tmp/storage/framework/sessions',
    '/tmp/storage/logs',
];

foreach ($dirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Carrega o entrypoint padrão do Laravel
require __DIR__ . '/../public/index.php';
