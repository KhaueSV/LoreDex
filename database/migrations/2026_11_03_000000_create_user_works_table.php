<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Biblioteca pessoal por usuário.
 *
 * - `works` passa a ser o CATÁLOGO global (compartilhado entre todos).
 * - `user_works` liga cada usuário às obras que ELE adicionou na própria biblioteca.
 * - `works.is_blocked` permite ao administrador tirar uma obra do ar temporariamente:
 *   ela some de todas as bibliotecas e ninguém consegue adicioná-la, mas os vínculos
 *   em `user_works` são mantidos, então tudo volta ao normal quando for desbloqueada.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_works', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('work_id')->constrained('works')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'work_id']);
        });

        if (!Schema::hasColumn('works', 'is_blocked')) {
            Schema::table('works', function (Blueprint $table) {
                $table->boolean('is_blocked')->default(false)->after('is_adult');
            });
        }

        // Antes a biblioteca era compartilhada: todas as obras existentes
        // entram na biblioteca de todos os usuários atuais (cada um remove o que não quiser).
        $now = now();
        $workIds = DB::table('works')->pluck('created_at', 'id');

        DB::table('users')->pluck('id')->each(function ($userId) use ($workIds, $now) {
            $rows = [];
            foreach ($workIds as $workId => $createdAt) {
                $rows[] = [
                    'user_id'    => $userId,
                    'work_id'    => $workId,
                    'created_at' => $createdAt ?? $now,
                    'updated_at' => $now,
                ];
            }
            foreach (array_chunk($rows, 500) as $chunk) {
                DB::table('user_works')->insertOrIgnore($chunk);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_works');

        if (Schema::hasColumn('works', 'is_blocked')) {
            Schema::table('works', function (Blueprint $table) {
                $table->dropColumn('is_blocked');
            });
        }
    }
};
