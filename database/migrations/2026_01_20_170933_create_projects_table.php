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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('purpose')->nullable();
            $table->text('scope')->nullable();
            $table->text('target_users')->nullable();
            $table->text('constraints')->nullable();
            $table->string('status')->default('active');
            $table->string('repository_url')->nullable();
            $table->string('opinionation_level')->default('guided'); // guided | flexible
            $table->boolean('ai_advisory_enabled')->default(true);
            $table->boolean('ai_consistency_checks_enabled')->default(false);
            $table->json('tags')->nullable();
            $table->json('nfr_summary')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
