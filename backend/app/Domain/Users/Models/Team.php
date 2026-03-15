<?php

namespace App\Domain\Users\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'broker_id',
        'company_id',
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the broker that owns this team.
     */
    public function broker()
    {
        return $this->belongsTo(User::class, 'broker_id');
    }

    /**
     * Get the company this team belongs to.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get all members of this team.
     */
    public function members()
    {
        return $this->hasMany(TeamMember::class);
    }

    /**
     * Get all agents in this team.
     */
    public function agents()
    {
        return $this->belongsToMany(User::class, 'team_members', 'team_id', 'agent_id')
            ->withPivot('role', 'is_active', 'joined_at')
            ->withTimestamps();
    }
}
