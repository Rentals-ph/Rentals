<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * - Add company_id and created_by_broker_id to users for broker-created agents
     * - Drop agent_approvals table (agent approval flow removed)
     */
    public function up(): void
    {
        // Add company association for both brokers and agents
        if (Schema::hasTable('companies')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'company_id')) {
                    $table->foreignId('company_id')->nullable()->after('role')->constrained('companies')->nullOnDelete();
                }
            });
        } else {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'company_id')) {
                    $table->unsignedBigInteger('company_id')->nullable()->after('role');
                }
            });
        }

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'created_by_broker_id')) {
                $after = Schema::hasColumn('users', 'company_id') ? 'company_id' : 'role';
                $table->foreignId('created_by_broker_id')->nullable()->after($after)->constrained('users')->nullOnDelete();
            }
        });

        // Drop agent_approvals table - agent approval flow removed
        if (Schema::hasTable('agent_approvals')) {
            Schema::dropIfExists('agent_approvals');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'company_id')) {
                $table->dropConstrainedForeignId('company_id');
            }
            if (Schema::hasColumn('users', 'created_by_broker_id')) {
                $table->dropConstrainedForeignId('created_by_broker_id');
            }
        });

        // Recreate agent_approvals table (minimal structure for rollback)
        if (!Schema::hasTable('agent_approvals')) {
            Schema::create('agent_approvals', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('approved_by_user_id')->constrained('users')->onDelete('cascade');
                $table->enum('action', ['approved', 'rejected']);
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }
};
