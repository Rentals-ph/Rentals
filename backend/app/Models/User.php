<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
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
        'whatsapp',
        'facebook',
        'date_of_birth',
        'role',
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
        'image_path',
        'status',
        'verified',
        'is_active',
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
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the user's full name.
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Check if user is an agent.
     */
    public function isAgent(): bool
    {
        return $this->role === 'agent';
    }

    /**
     * Check if user is an admin (any admin role).
     */
    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'super_admin', 'moderator']);
    }

    /**
     * Check if user is a super admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Check if admin can approve agents.
     */
    public function canApproveAgents(): bool
    {
        return in_array($this->role, ['super_admin', 'admin', 'broker']);
    }

    /**
     * Check if user is a broker.
     */
    public function isBroker(): bool
    {
        return $this->role === 'broker';
    }

    /**
     * Get all approvals/rejections for this user (if agent).
     */
    public function approvals()
    {
        return $this->hasMany(AgentApproval::class, 'user_id');
    }

    /**
     * Get the latest approval/rejection for this user (if agent).
     */
    public function latestApproval()
    {
        return $this->hasOne(AgentApproval::class, 'user_id')->latestOfMany();
    }

    /**
     * Get all agent approvals made by this user (if admin).
     */
    public function agentApprovals()
    {
        return $this->hasMany(AgentApproval::class, 'approved_by_user_id');
    }

    /**
     * Scope to get only agents.
     */
    public function scopeAgents($query)
    {
        return $query->where('role', 'agent');
    }

    /**
     * Scope to get only admins.
     */
    public function scopeAdmins($query)
    {
        return $query->whereIn('role', ['admin', 'super_admin', 'moderator']);
    }

    /**
     * Get all properties managed by this agent.
     */
    public function properties()
    {
        return $this->hasMany(Property::class, 'agent_id');
    }

    /**
     * Get all companies owned by this broker.
     */
    public function companies()
    {
        return $this->hasMany(Company::class, 'broker_id');
    }

    /**
     * Get all teams owned by this broker.
     */
    public function teams()
    {
        return $this->hasMany(Team::class, 'broker_id');
    }

    /**
     * Get all teams this agent is a member of.
     */
    public function teamMemberships()
    {
        return $this->hasMany(TeamMember::class, 'agent_id');
    }

    /**
     * Get active subscription for this broker.
     */
    public function activeSubscription()
    {
        return $this->hasOne(BrokerSubscription::class, 'broker_id')
            ->where('status', 'active')
            ->where(function($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Get all subscriptions for this broker.
     */
    public function subscriptions()
    {
        return $this->hasMany(BrokerSubscription::class, 'broker_id');
    }

    /**
     * Get all agents managed by this broker (through teams).
     */
    public function managedAgents()
    {
        return User::whereHas('teamMemberships', function($query) {
            $query->whereHas('team', function($q) {
                $q->where('broker_id', $this->id);
            });
        })->where('role', 'agent');
    }

    /**
     * Get messages sent by this user.
     */
    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * Get messages received by this user.
     */
    public function receivedMessages()
    {
        return $this->hasMany(Message::class, 'recipient_id');
    }
}

