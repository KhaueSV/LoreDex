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
    Schema::create('chapters', function (Blueprint $table) {
        $table->id();
        // Liga o capítulo diretamente a uma obra. Se a obra for deletada, os capítulos também somem.
        $table->foreignId('work_id')->constrained()->onDelete('cascade'); 
        $table->decimal('number', 8, 2); // Ex: 1, 1.5, 10
        $table->string('title')->nullable();
        $table->string('source_url')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chapters');
    }
};
