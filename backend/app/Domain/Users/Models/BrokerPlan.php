<?php

namespace App\Domain\Users\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BrokerPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'max_listings',
        'max_teams',
        'max_agents',
        'price',
        'billing_period',
        'is_active',
    ];

    protected $casts = [
        'max_listings' => 'integer',
        'max_teams' => 'integer',
        'max_agents' => 'integer',
        'price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Get all subscriptions for this plan.
     */
    public function subscriptions()
    {
        return $this->hasMany(BrokerSubscription::class, 'plan_id');
    }
}
