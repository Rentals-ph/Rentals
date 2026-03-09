<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'reviewable_type',
        'reviewable_id',
        'reviewer_type',
        'reviewer_id',
        'reviewer_name',
        'reviewer_email',
        'rating',
        'comment',
        'status',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * The reviewed entity (Property or User).
     * Manual polymorphic to stay consistent with the rest of the codebase.
     */
    public function reviewable()
    {
        if ($this->reviewable_type === 'App\\Models\\Property') {
            return $this->belongsTo(Property::class, 'reviewable_id');
        }

        return $this->belongsTo(User::class, 'reviewable_id');
    }

    /**
     * Registered-user reviewer.
     */
    public function reviewerUser()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /**
     * Guest reviewer.
     */
    public function reviewerGuest()
    {
        return $this->belongsTo(GuestSession::class, 'reviewer_id');
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Resolve display name of the reviewer.
     */
    public function getReviewerDisplayNameAttribute(): string
    {
        if ($this->reviewer_type === 'user') {
            $user = $this->reviewerUser;
            return $user ? $user->full_name : ($this->reviewer_name ?? 'Tenant');
        }

        return $this->reviewer_name ?? 'Guest';
    }
}

