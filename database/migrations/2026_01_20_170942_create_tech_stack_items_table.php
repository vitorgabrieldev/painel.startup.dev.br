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
        Schema::create('tech_stack_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('category'); // language, framework, database, infra, tooling, service
            $table->string('name');
            $table->string('version')->nullable();
            $table->text('rationale')->nullable();
            $table->string('status')->default('chosen'); // chosen, evaluating, deprecated
            $table->string('vendor_url')->nullable();
            $table->json('constraints')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tech_stack_items');
    }
};
