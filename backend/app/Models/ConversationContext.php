<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversationContext extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'context_type',
        'key',
        'value',
        'importance',
        'description',
    ];

    protected $casts = [
        'value' => 'array',
        'importance' => 'integer',
    ];

    /**
     * Get the conversation that owns this context
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Context types
     */
    public const TYPE_PREFERENCE = 'preference';
    public const TYPE_FACT = 'fact';
    public const TYPE_SEARCH_CRITERIA = 'search_criteria';
    public const TYPE_PROPERTY_INTEREST = 'property_interest';
    public const TYPE_USER_INFO = 'user_info';
}
