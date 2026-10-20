
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_reviews', function (Blueprint $table) {
            $table->foreignId('work_id')->constrained('works')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('comment');
            $table->string('verdict')->nullable();
            $table->decimal('score', 4, 2)->nullable();
            $table->json('criteria')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('work_reviews', function (Blueprint $table) {
            $table->dropForeign(['work_id']);
            $table->dropForeign(['user_id']);

            $table->dropColumn([
                'work_id',
                'user_id',
                'comment',
                'verdict',
                'score',
                'criteria',
            ]);
        });
    }
};
