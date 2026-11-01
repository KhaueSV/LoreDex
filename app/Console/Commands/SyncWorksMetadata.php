<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\WorkController;

class SyncWorksMetadata extends Command
{
    protected $signature = 'works:sync';
    protected $description = 'Sincroniza gêneros, capítulos e traduz as sinopses das obras para português.';

    public function handle(WorkController $controller)
    {
        $this->info('Sincronizando obras da biblioteca com AniList / Jikan / MangaDex e traduzindo para PT-BR...');
        $controller->syncMetadata(request());
        $this->info('Sincronização concluída com sucesso!');
        return self::SUCCESS;
    }
}
