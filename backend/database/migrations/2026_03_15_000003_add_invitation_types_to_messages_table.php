<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify the enum column to include invitation types
        // MySQL/MariaDB requires raw SQL to modify enum values
        DB::statement("ALTER TABLE `messages` MODIFY COLUMN `type` ENUM('contact', 'property_inquiry', 'general', 'team_invitation', 'broker_invitation') DEFAULT 'general'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum values
        DB::statement("ALTER TABLE `messages` MODIFY COLUMN `type` ENUM('contact', 'property_inquiry', 'general') DEFAULT 'general'");
    }
};

