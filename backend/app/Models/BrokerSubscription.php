<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BrokerSubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'broker_id',
        'plan_id',
        'listings_used',
        'teams_used',
        'agents_used',
        'status',
        'starts_at',
        'expires_at',
        'cancelled_at',
    ];

    protected $casts = [
        'listings_used' => 'integer',
        'teams_used' => 'integer',
        'agents_used' => 'integer',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    /**
     * Get the broker that owns this subscription.
     */
    public function broker()
    {
        return $this->belongsTo(User::class, 'broker_id');
    }

    /**
     * Get the plan for this subscription.
     */
    public function plan()
    {
        return $this->belongsTo(BrokerPlan::class, 'plan_id');
    }

    /**
     * Check if subscription is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active' 
            && ($this->expires_at === null || $this->expires_at->isFuture());
    }

    /**
     * Check if broker can create more listings.
     */
    public function canCreateListing(): bool
    {
        if (!$this->isActive()) {
            return false;
        }
        return $this->listings_used < $this->plan->max_listings;
    }

    /**
     * Check if broker can create more teams.
     */
    public function canCreateTeam(): bool
    {
        if (!$this->isActive()) {
            return false;
        }
        return $this->teams_used < $this->plan->max_teams;
    }

    /**
     * Check if broker can add more agents.
     */
    public function canAddAgent(): bool
    {
        if (!$this->isActive()) {
            return false;
        }
        return $this->agents_used < $this->plan->max_agents;
    }
}
