<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Guest sessions for Tier 1 (unauthenticated) tenants.
     * Session is identified by a browser token stored in a cookie / localStorage.
     */
    public function up(): void
    {
        Schema::create('guest_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('token', 80)->unique()->comment('Browser token stored in cookie / localStorage');
            $table->string('name');
            $table->string('email')->index()->comment('Used for later merge when guest registers');
            $table->timestamp('last_active_at')->nullable();
            $table->timestamp('expires_at')->nullable()->comment('Null = no expiry; set when session is merged');
            $table->boolean('is_merged')->default(false)->comment('Set to true after guest upgrades to tenant');
            $table->foreignId('merged_into_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['email', 'is_merged']);
            $table->index('token');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guest_sessions');
    }
};

