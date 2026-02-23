<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Agent extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'phone',
        'date_of_birth',
        'agency_name',
        'office_address',
        'city',
        'state',
        'zip_code',
        'prc_license_number',
        'license_type',
        'expiration_date',
        'years_of_experience',
        'license_document_path',
        'status',
        'verified',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'date_of_birth' => 'date',
            'expiration_date' => 'date',
            'password' => 'hashed',
            'verified' => 'boolean',
        ];
    }

    /**
     * Get the agent's full name.
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Get all approvals/rejections for this agent.
     */
    public function approvals()
    {
        return $this->hasMany(AgentApproval::class);
    }

    /**
     * Get the latest approval/rejection for this agent.
     */
    public function latestApproval()
    {
        return $this->hasOne(AgentApproval::class)->latestOfMany();
    }

    /**
     * Get the admin who approved/rejected this agent (if any).
     */
    public function approvedBy()
    {
        return $this->hasOneThrough(
            Admin::class,
            AgentApproval::class,
            'agent_id', // Foreign key on agent_approvals table
            'id', // Foreign key on admins table
            'id', // Local key on agents table
            'admin_id' // Local key on agent_approvals table
        )->where('agent_approvals.action', 'approved');
    }
}

