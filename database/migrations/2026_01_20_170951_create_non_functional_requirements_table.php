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
        Schema::create('non_functional_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('category'); // scalability, security, performance, cost, reliability, compliance, ux, maintainability
            $table->string('metric')->nullable();
            $table->string('target')->nullable();
            $table->string('priority')->default('medium');
            $table->text('rationale')->nullable();
            $table->text('current_assessment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('non_functional_requirements');
    }
};
