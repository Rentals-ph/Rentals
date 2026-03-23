<?php

namespace App\Domain\Messaging\Services;

use App\Domain\Messaging\Models\Conversation;
use App\Domain\Messaging\Models\ConversationContext;
use App\Domain\Messaging\Models\ConversationMessage;
use App\Domain\Properties\Models\Property;
use App\Domain\AI\Services\GroqService;
use Illuminate\Support\Collection;

class ConversationService
{
    /**
     * Get or create a conversation
     */
    public function getOrCreateConversation(?string $conversationId = null, ?int $userId = null): Conversation
    {
        if ($conversationId) {
            $conversation = Conversation::where('conversation_id', $conversationId)->first();
            if ($conversation) {
                return $conversation;
            }
        }

        // Create new conversation
        $conversation = Conversation::create([
            'user_id' => $userId,
            'conversation_id' => Conversation::generateConversationId(),
            'title' => null,
            'metadata' => [],
        ]);

        return $conversation;
    }

    /**
     * Add a message to the conversation
     */
    public function addMessage(
        Conversation $conversation,
        string $role,
        string $content,
        ?array $metadata = null
    ): ConversationMessage {
        $message = ConversationMessage::create([
            'conversation_id' => $conversation->id,
            'role' => $role,
            'content' => $content,
            'metadata' => $metadata ?? [],
        ]);

        // Update conversation's last message timestamp
        $conversation->update(['last_message_at' => now()]);

        return $message;
    }

    /**
     * Get conversation history (messages)
     */
    public function getConversationHistory(Conversation $conversation, int $limit = 20): Collection
    {
        return $conversation->messages()
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->reverse()
            ->map(function ($message) {
                return [
                    'role' => $message->role,
                    'content' => $message->content,
                ];
            })
            ->values();
    }

    /**
     * Get conversation context as a structured array
     */
    public function getConversationContext(Conversation $conversation): array
    {
        $contexts = $conversation->contexts()
            ->orderBy('importance', 'desc')
            ->get();

        $structured = [
            'preferences' => [],
            'facts' => [],
            'search_criteria' => [],
            'property_interests' => [],
            'user_info' => [],
        ];

        foreach ($contexts as $context) {
            $type = $context->context_type;
            // Map context types to structured array keys
            $typeMap = [
                ConversationContext::TYPE_PREFERENCE => 'preferences',
                ConversationContext::TYPE_FACT => 'facts',
                ConversationContext::TYPE_SEARCH_CRITERIA => 'search_criteria',
                ConversationContext::TYPE_PROPERTY_INTEREST => 'property_interests',
                ConversationContext::TYPE_USER_INFO => 'user_info',
            ];
            
            $key = $typeMap[$type] ?? $type;
            if (isset($structured[$key])) {
                $structured[$key][$context->key] = $context->value;
            }
        }

        return $structured;
    }

    /**
     * Extract and store context from a conversation message
     * Uses Groq to extract key information
     */
    public function extractAndStoreContext(
        Conversation $conversation,
        string $userQuery,
        ?array $searchCriteria = null,
        ?array $properties = null,
        GroqService $groqService
    ): void {
        // Extract context using Groq
        $extractedContext = $this->extractContextWithGroq($userQuery, $searchCriteria, $properties, $groqService);

        // Store extracted context (skip entries with null values)
        foreach ($extractedContext as $contextData) {
            // Skip if value is null or empty
            if (!isset($contextData['value']) || $contextData['value'] === null) {
                continue;
            }
            
            $this->storeContext(
                $conversation,
                $contextData['type'],
                $contextData['key'],
                $contextData['value'],
                $contextData['importance'] ?? 5,
                $contextData['description'] ?? null
            );
        }

        // Also store search criteria if provided
        if ($searchCriteria) {
            $this->storeSearchCriteria($conversation, $searchCriteria);
        }

        // Store property interests if properties were shown
        if ($properties && count($properties) > 0) {
            $this->storePropertyInterests($conversation, $properties);
        }
    }

    /**
     * Extract context using Groq AI
     */
    protected function extractContextWithGroq(
        string $userQuery,
        ?array $searchCriteria,
        ?array $properties,
        GroqService $groqService
    ): array {
        try {
            $contextData = [
                'user_query' => $userQuery,
                'search_criteria' => $searchCriteria,
                'properties_shown' => $properties ? count($properties) : 0,
            ];

            $prompt = <<<PROMPT
You are analyzing a real estate conversation to extract key context information that should be remembered for future interactions.

User Query: {$userQuery}

Search Criteria (if any): {$this->formatCriteriaForPrompt($searchCriteria)}

Properties Shown: {$contextData['properties_shown']}

Extract and return ONLY a JSON object with the following structure:
{
  "contexts": [
    {
      "type": "preference|fact|user_info",
      "key": "budget|location|property_type|user_name|etc",
      "value": <any value - string, number, array, or object>,
      "importance": 1-10,
      "description": "Human-readable description"
    }
  ]
}

Extract:
1. **User Preferences**: Budget range, preferred locations, property types, amenities, etc.
2. **Facts**: User's name (if mentioned), family size, work location, timeline, etc.
3. **User Info**: Any personal information mentioned

Rules:
- Only extract information that is explicitly mentioned or clearly implied
- Set importance: 10 = critical (budget, location), 7-9 = important (property type, preferences), 5-6 = useful (amenities), 1-4 = minor details
- For preferences, use keys like: "budget_min", "budget_max", "location", "property_type", "bedrooms", "bathrooms", "amenities", etc.
- For facts, use keys like: "user_name", "family_size", "work_location", "move_in_date", etc.
- Return empty contexts array if nothing significant to extract
- Do NOT infer or make assumptions beyond what's clearly stated
- CRITICAL: Do NOT include any context entry with a null value - only include entries where value is a valid string, number, array, or object
- If a value cannot be determined, omit that context entry entirely rather than including it with null
PROMPT;

            $response = $groqService->chat($prompt, null, 0.2, 1000);
            $parsed = json_decode($response, true);

            if (json_last_error() === JSON_ERROR_NONE && isset($parsed['contexts'])) {
                return $parsed['contexts'];
            }

            return [];
        } catch (\Exception $e) {
            \Log::error('Context extraction failed: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Format search criteria for prompt
     */
    protected function formatCriteriaForPrompt(?array $criteria): string
    {
        if (!$criteria) {
            return 'None';
        }

        $formatted = [];
        foreach ($criteria as $key => $value) {
            if ($value !== null && $value !== '') {
                $formatted[] = "{$key}: " . (is_array($value) ? json_encode($value) : $value);
            }
        }

        return empty($formatted) ? 'None' : implode(', ', $formatted);
    }

    /**
     * Store a context entry
     */
    public function storeContext(
        Conversation $conversation,
        string $type,
        string $key,
        $value,
        int $importance = 5,
        ?string $description = null
    ): ?ConversationContext {
        // Skip if value is null or empty string
        if ($value === null || $value === '') {
            return null;
        }

        // Check if context already exists
        $existing = ConversationContext::where('conversation_id', $conversation->id)
            ->where('context_type', $type)
            ->where('key', $key)
            ->first();

        if ($existing) {
            // Update existing context (merge values if array, otherwise replace)
            if (is_array($value) && is_array($existing->value)) {
                $mergedValue = array_merge($existing->value, $value);
            } else {
                $mergedValue = $value;
            }

            // Skip update if merged value is null
            if ($mergedValue === null || $mergedValue === '') {
                return $existing;
            }

            $existing->update([
                'value' => $mergedValue,
                'importance' => max($importance, $existing->importance), // Keep higher importance
                'description' => $description ?? $existing->description,
            ]);

            return $existing;
        }

        // Create new context
        return ConversationContext::create([
            'conversation_id' => $conversation->id,
            'context_type' => $type,
            'key' => $key,
            'value' => $value,
            'importance' => $importance,
            'description' => $description,
        ]);
    }

    /**
     * Store search criteria as context
     */
    protected function storeSearchCriteria(Conversation $conversation, array $criteria): void
    {
        foreach ($criteria as $key => $value) {
            if ($value !== null && $value !== '') {
                $importance = $this->getCriteriaImportance($key);
                $this->storeContext(
                    $conversation,
                    ConversationContext::TYPE_SEARCH_CRITERIA,
                    $key,
                    $value,
                    $importance,
                    "Search criteria: {$key}"
                );
            }
        }
    }

    /**
     * Store property interests
     */
    protected function storePropertyInterests(Conversation $conversation, array $properties): void
    {
        // Extract common characteristics from shown properties
        $locations = [];
        $propertyTypes = [];
        $priceRanges = [];

        foreach ($properties as $property) {
            if (isset($property['city'])) {
                $locations[] = $property['city'];
            }
            if (isset($property['type'])) {
                $propertyTypes[] = $property['type'];
            }
            if (isset($property['price'])) {
                $priceRanges[] = (float) $property['price'];
            }
        }

        if (!empty($locations)) {
            $this->storeContext(
                $conversation,
                ConversationContext::TYPE_PROPERTY_INTEREST,
                'viewed_locations',
                array_unique($locations),
                7,
                'Locations of properties user has viewed'
            );
        }

        if (!empty($propertyTypes)) {
            $this->storeContext(
                $conversation,
                ConversationContext::TYPE_PROPERTY_INTEREST,
                'viewed_property_types',
                array_unique($propertyTypes),
                7,
                'Property types user has viewed'
            );
        }

        if (!empty($priceRanges)) {
            $this->storeContext(
                $conversation,
                ConversationContext::TYPE_PROPERTY_INTEREST,
                'viewed_price_range',
                [
                    'min' => min($priceRanges),
                    'max' => max($priceRanges),
                ],
                8,
                'Price range of properties user has viewed'
            );
        }
    }

    /**
     * Get importance level for search criteria
     */
    protected function getCriteriaImportance(string $key): int
    {
        $importanceMap = [
            'location' => 10,
            'city' => 10,
            'min_price' => 9,
            'max_price' => 9,
            'exact_price' => 9,
            'property_type' => 8,
            'bedrooms' => 7,
            'bathrooms' => 7,
            'amenities' => 6,
            'furnishing' => 5,
        ];

        return $importanceMap[$key] ?? 5;
    }

    /**
     * Clear all context for a conversation
     */
    public function clearContext(Conversation $conversation): void
    {
        $conversation->contexts()->delete();
    }

    /**
     * Delete a conversation and all related data
     */
    public function deleteConversation(Conversation $conversation): bool
    {
        return $conversation->delete(); // Cascade will handle messages and contexts
    }

    /**
     * Get last search properties from conversation
     * Checks both search and conversational messages that have properties
     */
    public function getLastSearchProperties(Conversation $conversation): ?array
    {
        // First try to get from search messages
        $lastSearchMessage = $conversation->messages()
            ->where('role', 'assistant')
            ->whereJsonContains('metadata->response_type', 'search')
            ->orderBy('created_at', 'desc')
            ->first();

        if ($lastSearchMessage && isset($lastSearchMessage->metadata['properties'])) {
            return $lastSearchMessage->metadata['properties'];
        }

        // If no search message, check conversational messages that have properties
        $lastConversationalMessage = $conversation->messages()
            ->where('role', 'assistant')
            ->whereJsonContains('metadata->response_type', 'conversational')
            ->whereNotNull('metadata->properties')
            ->orderBy('created_at', 'desc')
            ->first();

        if ($lastConversationalMessage && isset($lastConversationalMessage->metadata['properties'])) {
            return $lastConversationalMessage->metadata['properties'];
        }

        return null;
    }

    /**
     * List conversations for a user
     */
    public function listConversations(?int $userId = null, int $limit = 50): Collection
    {
        $query = Conversation::query();

        if ($userId) {
            $query->where('user_id', $userId);
        } else {
            $query->whereNull('user_id');
        }

        return $query->orderBy('last_message_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($conversation) {
                return [
                    'id' => $conversation->id,
                    'conversation_id' => $conversation->conversation_id,
                    'title' => $conversation->title ?? 'New Conversation',
                    'last_message_at' => $conversation->last_message_at,
                    'created_at' => $conversation->created_at,
                    'message_count' => $conversation->messages()->count(),
                ];
            });
    }

    /**
     * Generate conversation title from first message
     */
    public function generateTitle(Conversation $conversation, GroqService $groqService): ?string
    {
        $firstMessage = $conversation->messages()->where('role', 'user')->first();
        
        if (!$firstMessage) {
            return null;
        }

        try {
            $prompt = "Generate a short, descriptive title (max 60 characters) for this real estate conversation query: \"{$firstMessage->content}\"\n\nReturn ONLY the title, no quotes or explanation.";
            $title = $groqService->chat($prompt, null, 0.3, 100);
            $title = trim($title, '"\'');
            
            if (strlen($title) > 60) {
                $title = substr($title, 0, 57) . '...';
            }

            $conversation->update(['title' => $title]);
            return $title;
        } catch (\Exception $e) {
            \Log::error('Title generation failed: ' . $e->getMessage());
            return null;
        }
    }
}

