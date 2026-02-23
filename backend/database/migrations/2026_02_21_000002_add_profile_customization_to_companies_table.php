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
        Schema::table('companies', function (Blueprint $table) {
            $table->string('hero_image')->nullable()->after('logo');
            $table->string('whatsapp')->nullable()->after('phone');
            $table->json('custom_stats')->nullable()->after('description'); // [{label: '', value: ''}, ...]
            $table->string('join_section_title')->nullable()->after('description');
            $table->text('join_section_description')->nullable()->after('join_section_title');
            $table->json('awards')->nullable()->after('description'); // [{title: '', image: '', year: ''}, ...]
            $table->boolean('show_team_section')->default(true)->after('is_active');
            $table->boolean('show_broker_picks_section')->default(true)->after('show_team_section');
            $table->boolean('show_awards_section')->default(true)->after('show_broker_picks_section');
            $table->boolean('show_join_section')->default(true)->after('show_awards_section');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'hero_image',
                'whatsapp',
                'custom_stats',
                'join_section_title',
                'join_section_description',
                'awards',
                'show_team_section',
                'show_broker_picks_section',
                'show_awards_section',
                'show_join_section',
            ]);
        });
    }
};

