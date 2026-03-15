<?php

namespace App\Domain\Users\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TenantProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'preferred_move_in_date',
        'budget_min',
        'budget_max',
        'preferred_locations',
        'lifestyle_notes',
    ];

    protected $casts = [
        'preferred_move_in_date' => 'date',
        'budget_min'             => 'decimal:2',
        'budget_max'             => 'decimal:2',
        'preferred_locations'    => 'array',
    ];

    /**
     * The tenant user who owns this profile.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

