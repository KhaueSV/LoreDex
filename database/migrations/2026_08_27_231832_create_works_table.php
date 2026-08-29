<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('works', function (Blueprint $table) {
        $table->id();
        $table->string('title');
        $table->enum('type', ['novel', 'manga', 'webnovel'])->default('novel');
        $table->string('author')->nullable();
        $table->text('synopsis')->nullable();
        $table->string('cover_url')->nullable();
        $table->enum('status', ['ongoing', 'completed', 'dropped'])->default('ongoing');
        $table->timestamps(); // Cria as colunas created_at e updated_at automaticamente
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('works');
    }
};
