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
        Schema::create('risks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('severity')->default('medium');
            $table->string('likelihood')->default('medium');
            $table->string('impact_area')->nullable();
            $table->text('description')->nullable();
            $table->text('mitigation')->nullable();
            $table->string('owner')->nullable();
            $table->string('status')->default('open'); // open, monitoring, mitigated, closed
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('risks');
    }
};
