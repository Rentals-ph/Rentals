<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'broker_id',
        'name',
        'description',
        'address',
        'phone',
        'email',
        'website',
        'logo',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the broker that owns this company.
     */
    public function broker()
    {
        return $this->belongsTo(User::class, 'broker_id');
    }

    /**
     * Get all teams for this company.
     */
    public function teams()
    {
        return $this->hasMany(Team::class);
    }

    /**
     * Get all users (brokers/agents) associated with this company.
     */
    public function users()
    {
        return $this->hasMany(User::class, 'company_id');
    }
}
