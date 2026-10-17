<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('collection_work', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collection_id')->constrained()->cascadeOnDelete();
            $table->foreignId('work_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['collection_id', 'work_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_work');
        Schema::dropIfExists('collections');
    }
};
