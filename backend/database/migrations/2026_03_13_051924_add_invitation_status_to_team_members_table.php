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
        Schema::table('team_members', function (Blueprint $table) {
            $table->enum('invitation_status', ['pending', 'accepted', 'rejected'])->default('accepted')->after('role');
            $table->foreignId('invitation_message_id')->nullable()->constrained('messages')->nullOnDelete()->after('invitation_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_members', function (Blueprint $table) {
            $table->dropForeign(['invitation_message_id']);
            $table->dropColumn(['invitation_status', 'invitation_message_id']);
        });
    }
};
