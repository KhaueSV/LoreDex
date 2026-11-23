<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_work_activity', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('work_id')->constrained()->cascadeOnDelete();
            $table->timestamp('last_viewed_at')->nullable();
            $table->boolean('is_favorite')->default(false);
            $table->primary(['user_id', 'work_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_work_activity');
    }
};
