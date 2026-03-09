<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_views', function (Blueprint $table) {
            $table->id();
            // Polymorphic — currently always 'user', but extensible for future entity types
            $table->string('viewable_type');
            $table->unsignedBigInteger('viewable_id');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('guest_session_id')->nullable()->constrained('guest_sessions')->onDelete('set null');
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('viewed_at')->useCurrent();

            $table->index(['viewable_type', 'viewable_id', 'user_id'], 'pv_viewable_user_idx');
            $table->index(['viewable_type', 'viewable_id', 'guest_session_id'], 'pv_viewable_guest_idx');
            $table->index(['viewable_type', 'viewable_id', 'ip_address'], 'pv_viewable_ip_idx');
            $table->index('viewed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_views');
    }
};

