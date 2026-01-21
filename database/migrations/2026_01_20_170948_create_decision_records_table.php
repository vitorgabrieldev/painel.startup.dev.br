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
        Schema::create('decision_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supersedes_id')->nullable()->constrained('decision_records')->nullOnDelete();
            $table->string('title');
            $table->string('status')->default('accepted'); // proposed, accepted, superseded, rejected
            $table->text('context')->nullable();
            $table->json('options')->nullable();
            $table->text('decision')->nullable();
            $table->text('consequences')->nullable();
            $table->json('references')->nullable();
            $table->json('tags')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('decision_records');
    }
};
