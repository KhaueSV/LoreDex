<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('works', function (Blueprint $table) {
            if (!Schema::hasColumn('works', 'genres')) {
                $table->json('genres')->nullable()->after('status');
            }
            if (!Schema::hasColumn('works', 'is_adult')) {
                $table->boolean('is_adult')->default(false)->after('status');
            }
            if (!Schema::hasColumn('works', 'total_chapters')) {
                $table->integer('total_chapters')->default(0)->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('works', function (Blueprint $table) {
            $cols = [];
            foreach (['genres', 'is_adult', 'total_chapters'] as $col) {
                if (Schema::hasColumn('works', $col)) {
                    $cols[] = $col;
                }
            }
            if ($cols) {
                $table->dropColumn($cols);
            }
        });
    }
};
