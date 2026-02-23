<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgentApproval extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'approved_by_user_id',
        'action',
        'notes',
    ];

    /**
     * Get the user (agent) that was approved/rejected.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the agent that was approved/rejected (alias for user).
     */
    public function agent()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the user (admin) who made the approval/rejection.
     */
    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    /**
     * Get the admin who made the approval/rejection (alias for approvedBy).
     */
    public function admin()
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }
}

