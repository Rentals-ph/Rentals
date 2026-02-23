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
        Schema::table('properties', function (Blueprint $table) {
            $table->foreignId('agent_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
            $table->integer('garage')->nullable()->after('bathrooms');
            $table->integer('lot_area')->nullable()->after('area');
            $table->string('floor_area_unit', 20)->default('Square Meters')->after('lot_area');
            $table->text('amenities')->nullable()->after('floor_area_unit'); // JSON array
            $table->string('furnishing', 50)->nullable()->after('amenities');
            $table->string('video_url')->nullable()->after('image');
            $table->string('latitude', 50)->nullable()->after('location');
            $table->string('longitude', 50)->nullable()->after('latitude');
            $table->string('zoom_level', 10)->nullable()->after('longitude');
            $table->string('country', 100)->default('Philippines')->after('zoom_level');
            $table->string('state_province', 100)->nullable()->after('country');
            $table->string('city', 100)->nullable()->after('state_province');
            $table->text('street_address')->nullable()->after('city');
            // Owner information
            $table->string('owner_firstname', 100)->nullable()->after('street_address');
            $table->string('owner_lastname', 100)->nullable()->after('owner_firstname');
            $table->string('owner_phone', 50)->nullable()->after('owner_lastname');
            $table->string('owner_email', 255)->nullable()->after('owner_phone');
            $table->string('owner_country', 100)->nullable()->after('owner_email');
            $table->string('owner_state', 100)->nullable()->after('owner_country');
            $table->string('owner_city', 100)->nullable()->after('owner_state');
            $table->text('owner_street_address')->nullable()->after('owner_city');
            $table->string('rapa_document_path')->nullable()->after('owner_street_address');
            $table->string('price_type', 20)->default('Monthly')->after('price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropForeign(['agent_id']);
            $table->dropColumn([
                'agent_id',
                'garage',
                'lot_area',
                'floor_area_unit',
                'amenities',
                'furnishing',
                'video_url',
                'latitude',
                'longitude',
                'zoom_level',
                'country',
                'state_province',
                'city',
                'street_address',
                'owner_firstname',
                'owner_lastname',
                'owner_phone',
                'owner_email',
                'owner_country',
                'owner_state',
                'owner_city',
                'owner_street_address',
                'rapa_document_path',
                'price_type',
            ]);
        });
    }
};
