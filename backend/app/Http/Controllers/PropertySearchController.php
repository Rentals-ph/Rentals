<?php

namespace App\Http\Controllers;

use App\Domain\Properties\Models\Property;
use App\Domain\Messaging\Models\Conversation;
use App\Domain\AI\Services\GroqService;
use App\Domain\Messaging\Services\ConversationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class PropertySearchController extends Controller
{
    public function __construct(
        protected GroqService $groqService,
        protected ConversationService $conversationService
    ) {
    }

    /**
     * Main AI search endpoint.
     * Accepts a natural language query and returns matching properties
     * with an AI-generated recommendation.
     */
    #[OA\Post(
        path: "/property/search",
        summary: "AI-powered property search using natural language",
        description: "Search for properties using natural language queries. The AI will parse your query, search the database, and generate personalized recommendations.",
        tags: ["AI", "Properties"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["query"],
                    properties: [
                        new OA\Property(
                            property: "query",
                            type: "string",
                            minLength: 1,
                            maxLength: 500,
                            description: "Natural language search query or conversational follow-up (e.g., '3 bedroom house in Quezon City', 'hi', 'Is that recommendation good?')",
                            example: "3 bedroom house in Quezon City under 8 million with parking"
                        ),
                        new OA\Property(
                            property: "conversation_id",
                            type: "string",
                            nullable: true,
                            description: "Optional conversation ID for maintaining context across multiple messages. If not provided, a new conversation will start.",
                            example: "conv_abc123"
                        ),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Search results with AI-generated recommendations",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "query", type: "string", description: "The original user query"),
                        new OA\Property(
                            property: "criteria",
                            type: "object",
                            description: "Extracted search criteria from the query - all property-related fields are analyzed",
                            properties: [
                                new OA\Property(property: "location", type: "string", nullable: true, description: "City, area, neighborhood, or property name"),
                                new OA\Property(property: "property_type", type: "string", nullable: true, description: "Property type (House, Condominium, Apartment, etc.)"),
                                new OA\Property(property: "exact_price", type: "number", nullable: true, description: "Exact price when user specifies 'price of X'"),
                                new OA\Property(property: "min_price", type: "number", nullable: true),
                                new OA\Property(property: "max_price", type: "number", nullable: true),
                                new OA\Property(property: "price_type", type: "string", nullable: true, description: "Monthly, Yearly, Daily"),
                                new OA\Property(property: "bedrooms", type: "integer", nullable: true),
                                new OA\Property(property: "bathrooms", type: "integer", nullable: true),
                                new OA\Property(property: "garage", type: "integer", nullable: true, description: "Number of parking spaces"),
                                new OA\Property(property: "min_area_sqm", type: "number", nullable: true),
                                new OA\Property(property: "min_lot_area_sqm", type: "number", nullable: true),
                                new OA\Property(property: "floor_area_unit", type: "string", nullable: true),
                                new OA\Property(property: "amenities", type: "array", items: new OA\Items(type: "string"), nullable: true),
                                new OA\Property(property: "furnishing", type: "string", nullable: true, description: "Furnished, Semi-Furnished, Unfurnished"),
                                new OA\Property(property: "country", type: "string", nullable: true),
                                new OA\Property(property: "state_province", type: "string", nullable: true),
                                new OA\Property(property: "city", type: "string", nullable: true),
                                new OA\Property(property: "street_address", type: "string", nullable: true),
                                new OA\Property(property: "is_featured", type: "boolean", nullable: true),
                                new OA\Property(property: "search_text", type: "string", nullable: true, description: "General text to search in title/description"),
                            ]
                        ),
                        new OA\Property(
                            property: "properties",
                            type: "array",
                            description: "List of matching properties",
                            items: new OA\Items(type: "object")
                        ),
                        new OA\Property(property: "ai_response", type: "string", description: "AI-generated natural language response (recommendation, confirmation, insight, etc.)"),
                        new OA\Property(property: "count", type: "integer", description: "Number of properties found (only for search queries)"),
                        new OA\Property(property: "conversation_id", type: "string", nullable: true, description: "Conversation ID for maintaining context"),
                        new OA\Property(property: "response_type", type: "string", description: "Type of response: 'search' or 'conversational'"),
                        new OA\Property(property: "is_search", type: "boolean", description: "Whether this was treated as a search query"),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: "Validation error",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string"),
                        new OA\Property(property: "errors", type: "object"),
                    ]
                )
            ),
        ]
    )]
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'query' => ['required', 'string', 'min:1', 'max:500'],
            'conversation_id' => ['nullable', 'string', 'max:100'],
        ]);

        $userQuery = $request->input('query');
        $conversationIdInput = $request->input('conversation_id');
        $userId = $request->user()?->id;

        // ── Step 1: Get or create conversation ──
        $conversation = $this->conversationService->getOrCreateConversation($conversationIdInput, $userId);
        $conversationId = $conversation->conversation_id;

        // ── Step 2: Get conversation context and history ──
        $conversationHistory = $this->conversationService->getConversationHistory($conversation)->toArray();
        $conversationContext = $this->conversationService->getConversationContext($conversation);
        $lastSearchProperties = $this->conversationService->getLastSearchProperties($conversation);

        // ── Step 3: Analyze query intent (search vs conversational) ──
        $intent = $this->groqService->analyzeQueryIntent($userQuery);
        
        // Also check for general availability questions using keyword detection
        $isGeneralAvailabilityQuestion = $this->isGeneralAvailabilityQuestion($userQuery);
        
        // If it's a general availability question, treat it as conversational
        // Otherwise use the AI intent detection
        $isSearch = !$isGeneralAvailabilityQuestion && $intent['is_search'] && $intent['confidence'] > 0.5;

        // Force search for explicit "latest/new/recent listings in [place]" type questions
        // so the AI always recognizes them even if intent or API misclassifies
        if ($this->isExplicitListingSearch($userQuery)) {
            $isSearch = true;
        }

        // ── Step 4: Handle based on intent ──
        if ($isSearch) {
            // This is a search query - perform property search
            $criteria = $this->groqService->parseUserQuery($userQuery);
            // When user asked for "latest/new listings in [place]" but AI returned empty criteria, fill from query
            if ($this->isExplicitListingSearch($userQuery)) {
                $criteria = $this->ensureListingSearchCriteria($userQuery, $criteria);
            }
            $properties = $this->queryProperties($criteria);
            
            // Generate recommendation response with context
            $aiResponse = $this->groqService->generatePropertyResponse(
                $userQuery,
                $properties->toArray(),
                $conversationContext
            );

            // Store user message
            $this->conversationService->addMessage(
                $conversation,
                'user',
                $userQuery,
                ['query_type' => 'search']
            );

            // Store assistant response
            $this->conversationService->addMessage(
                $conversation,
                'assistant',
                $aiResponse,
                [
                    'response_type' => 'search',
                    'criteria' => $criteria,
                    'properties' => $properties->toArray(),
                    'count' => $properties->count(),
                ]
            );
            
            // Extract and store context
            $this->conversationService->extractAndStoreContext(
                $conversation,
                $userQuery,
                $criteria,
                $properties->toArray(),
                $this->groqService
            );

            // Generate title if this is the first message
            if ($conversation->messages()->count() === 2 && !$conversation->title) {
                $this->conversationService->generateTitle($conversation, $this->groqService);
            }

            return response()->json([
                'query' => $userQuery,
                'criteria' => $criteria,
                'properties' => $properties,
                'ai_response' => $aiResponse,
                'count' => $properties->count(),
                'conversation_id' => $conversationId,
                'response_type' => 'search',
                'is_search' => true,
            ]);
        } else {
            // This is a conversational follow-up - use conversational response
            $properties = collect([]);
            $criteria = [];
            $generalPropertyData = null;
            
            // Determine if properties are needed for this conversational query
            $shouldIncludeProperties = $this->shouldIncludePropertiesInResponse($userQuery, $conversationHistory);
            
            if ($shouldIncludeProperties) {
                // Check for "show me more" or similar requests - perform a new search based on previous criteria
                // Match patterns like: "show me more", "can you show me more", "give me more", "find more", etc.
                $isMoreRequest = preg_match('/\b(can\s+you\s+)?(show|give|find|get|recommend|suggest)\s+(me\s+)?(more|additional|other|another|different|others)\b/i', $userQuery);
                
                if ($isMoreRequest && $lastSearchProperties && !empty($lastSearchProperties)) {
                    // User wants more properties - use previous search criteria but fetch different ones
                    // Get the last search criteria from conversation context or conversation metadata
                    $lastMessage = end($conversationHistory);
                    $lastCriteria = $lastMessage['metadata']['criteria'] ?? [];
                    
                    // Also check conversation context for criteria
                    if (empty($lastCriteria) && $conversationContext) {
                        $lastCriteria = [
                            'location' => $conversationContext['preferences']['location'] ?? null,
                            'property_type' => $conversationContext['preferences']['property_type'] ?? null,
                            'min_price' => $conversationContext['preferences']['min_price'] ?? null,
                            'max_price' => $conversationContext['preferences']['max_price'] ?? null,
                            'bedrooms' => $conversationContext['preferences']['bedrooms'] ?? null,
                        ];
                        $lastCriteria = array_filter($lastCriteria); // Remove null values
                    }
                    
                    if (!empty($lastCriteria)) {
                        // Check if user wants to modify criteria (e.g., "any price", "no price limit")
                        $modifiedCriteria = $lastCriteria;
                        
                        // Check for price modifications
                        if (preg_match('/\b(any\s+price|no\s+price|without\s+price|remove\s+price|ignore\s+price|now\s+any\s+price)\b/i', $userQuery)) {
                            unset($modifiedCriteria['min_price']);
                            unset($modifiedCriteria['max_price']);
                            unset($modifiedCriteria['exact_price']);
                        }
                        
                        // Perform a new search with (possibly modified) criteria to get more/different properties
                        $criteria = $modifiedCriteria;
                        $allProperties = $this->queryProperties($criteria);
                        
                        // Exclude already shown property IDs to get different ones
                        $shownIds = collect($lastSearchProperties)->pluck('id')->toArray();
                        $properties = $allProperties->reject(function ($property) use ($shownIds) {
                            return in_array($property->id, $shownIds);
                        });
                        
                        // If we filtered out all, take a random subset from all properties
                        if ($properties->isEmpty() && $allProperties->isNotEmpty()) {
                            $properties = $allProperties->shuffle()->take(min(10, $allProperties->count()));
                        } elseif ($properties->count() > 10) {
                            // Limit to 10 new properties
                            $properties = $properties->take(10);
                        }
                        
                        \Log::info('PropertySearchController: "Show me more" request processed', [
                            'query' => $userQuery,
                            'last_criteria' => $lastCriteria,
                            'modified_criteria' => $modifiedCriteria,
                            'all_properties_count' => $allProperties->count(),
                            'filtered_properties_count' => $properties->count(),
                            'shown_ids_count' => count($shownIds),
                        ]);
                    } else {
                        // No previous criteria, perform a general search for more properties
                        $criteria = [];
                        $properties = $this->queryProperties($criteria);
                        
                        // Exclude already shown IDs
                        if ($properties->isNotEmpty()) {
                            $shownIds = collect($lastSearchProperties)->pluck('id')->toArray();
                            $properties = $properties->reject(function ($property) use ($shownIds) {
                                return in_array($property->id, $shownIds);
                            })->take(10);
                        }
                    }
                } elseif ($this->shouldPerformSearchForConversational($userQuery)) {
                    // Check if the query might benefit from a property search
                    // (e.g., "recommend me cozy apartments" should search for apartments)
                    $criteria = $this->groqService->parseUserQuery($userQuery);
                    $properties = $this->queryProperties($criteria);
                }
                
                // Get general property data if no specific search was performed
                if ($properties->isEmpty()) {
                    $generalPropertyData = $this->getGeneralPropertyDataIfNeeded($userQuery);
                    // Use general properties if available
                    if ($generalPropertyData && !empty($generalPropertyData['sample_properties'])) {
                        $properties = collect($generalPropertyData['sample_properties']);
                    }
                }
                
                // Use last search properties if we have them and current search is empty (only if not a "more" request)
                if ($properties->isEmpty() && $lastSearchProperties && !$isMoreRequest) {
                    $properties = collect($lastSearchProperties);
                }
            }
            
            // Determine which properties to pass to the response
            // Priority: current properties > last search properties > general property data
            $propertiesForResponse = null;
            if ($properties->isNotEmpty()) {
                $propertiesForResponse = $properties->toArray();
            } elseif ($lastSearchProperties) {
                $propertiesForResponse = $lastSearchProperties;
            }
            
            $aiResponse = $this->groqService->generateConversationalResponse(
                $userQuery,
                $conversationHistory,
                $propertiesForResponse,
                $shouldIncludeProperties ? $generalPropertyData : null,
                $conversationContext
            );

            // Store user message
            $this->conversationService->addMessage(
                $conversation,
                'user',
                $userQuery,
                ['query_type' => 'conversational']
            );

            // Store assistant response with properties (always as array, never null)
            $propertiesArray = $properties->isNotEmpty() ? $properties->toArray() : [];
            $this->conversationService->addMessage(
                $conversation,
                'assistant',
                $aiResponse,
                [
                    'response_type' => 'conversational',
                    'criteria' => $criteria,
                    'properties' => $propertiesArray, // Always array, never null
                    'count' => count($propertiesArray),
                ]
            );

            // Extract and store context if there's meaningful information
            if ($shouldIncludeProperties || !empty($criteria)) {
                $this->conversationService->extractAndStoreContext(
                    $conversation,
                    $userQuery,
                    $criteria,
                    $properties->isNotEmpty() ? $properties->toArray() : null,
                    $this->groqService
                );
            }

            // Generate title if this is the first message
            if ($conversation->messages()->count() === 2 && !$conversation->title) {
                $this->conversationService->generateTitle($conversation, $this->groqService);
            }

            $response = [
                'query' => $userQuery,
                'ai_response' => $aiResponse,
                'conversation_id' => $conversationId,
                'response_type' => 'conversational',
                'is_search' => false,
            ];
            
            // Always include properties if they were fetched (even for conversational queries)
            // This ensures the frontend always has the correct properties to display
            $propertiesArray = $properties->isNotEmpty() ? $properties->toArray() : [];
            $response['criteria'] = $criteria;
            $response['properties'] = $propertiesArray;
            $response['count'] = count($propertiesArray);
            
            // Log for debugging
            \Log::info('PropertySearchController: Returning properties', [
                'query' => $userQuery,
                'is_more_request' => $isMoreRequest ?? false,
                'properties_count' => count($propertiesArray),
                'properties_ids' => array_column($propertiesArray, 'id'),
            ]);

            return response()->json($response);
        }
    }


    /**
     * Check if query is an explicit "latest/new/recent listings in [city]" style search.
     * These should always be treated as property search, not conversational.
     *
     * @param string $query
     * @return bool
     */
    protected function isExplicitListingSearch(string $query): bool
    {
        $q = strtolower(trim($query));
        // "latest listings in Cebu City", "new listings in Manila", "recent listings in Makati"
        $listingPatterns = [
            '/\b(latest|newest|new|recent|fresh)\s+(listings?|properties|rentals?|houses?|apartments?|condos?|units?)/i',
            '/\b(listings?|properties|rentals?|houses?|apartments?|condos?|units?)\s+(in|at|for)\s+.+\s+(latest|newest|new|recent)\b/i',
            '/\b(latest|newest|new|recent)\s+(in|at|for)\s+.+/i',
            '/\b(latest|newest|new|recent)\s+(listings?|properties|rentals?)\s*$/i',
        ];
        foreach ($listingPatterns as $pattern) {
            if (preg_match($pattern, $q)) {
                return true;
            }
        }
        return false;
    }

    /**
     * When query is "latest listings in Cebu City" style, ensure criteria has location and sort_by.
     * Fills in from the raw query if AI returned empty or partial criteria.
     *
     * @param string $userQuery
     * @param array $criteria
     * @return array
     */
    protected function ensureListingSearchCriteria(string $userQuery, array $criteria): array
    {
        $criteria = array_merge(['sort_by' => 'newest'], $criteria);
        
        // If location is already set by AI, don't override
        if (!empty($criteria['location']) || !empty($criteria['city'])) {
            return $criteria;
        }

        // Extract place from "latest listings in Cebu City", "new listings in Manila", etc.
        // Pattern 1: [latest|new|...] [listings|...] in [Place]
        if (preg_match('/\b(?:latest|newest|new|recent|fresh)\s+(?:listings?|properties|rentals?|houses?|apartments?|condos?|units?)\s+(?:in|at|for)\s+([^,.\?]+)/i', $userQuery, $m)) {
            $place = trim($m[1]);
        } 
        // Pattern 2: [latest|new|...] in [Place]
        elseif (preg_match('/\b(?:latest|newest|new|recent|fresh)\s+(?:in|at|for)\s+([^,.\?]+)/i', $userQuery, $m)) {
            $place = trim($m[1]);
        }
        // Pattern 3: fall back to [in|at] [Place]
        elseif (preg_match('/\b(?:in|at)\s+([^,.\?]+)/i', $userQuery, $m)) {
            $place = trim($m[1]);
        }

        if (isset($place) && $place !== '') {
            $criteria['location'] = $place;
            $criteria['city'] = $place;
        }

        return $criteria;
    }

    /**
     * Check if query is a general availability question
     * 
     * @param string $query
     * @return bool
     */
    protected function isGeneralAvailabilityQuestion(string $query): bool
    {
        $queryLower = strtolower(trim($query));
        
        // Patterns that indicate general availability questions
        $generalQuestionPatterns = [
            '/^is there.*(available|property|properties)/i',
            '/^are there.*(available|property|properties)/i',
            '/^do you have.*(property|properties)/i',
            '/^what.*(property|properties).*(available|do you have|are there)/i',
            '/^(available|property|properties).*(today|now|currently)/i',
            '/^any.*(property|properties).*(available|today)/i',
        ];
        
        foreach ($generalQuestionPatterns as $pattern) {
            if (preg_match($pattern, $queryLower)) {
                return true;
            }
        }
        
        // Check for question words with availability keywords
        $questionWords = ['is', 'are', 'do', 'does', 'can', 'will', 'what'];
        $availabilityKeywords = ['available', 'property', 'properties', 'there', 'have'];
        
        $hasQuestionWord = false;
        $hasAvailabilityKeyword = false;
        
        foreach ($questionWords as $word) {
            if (strpos($queryLower, $word) === 0 || preg_match('/\b' . $word . '\b/', $queryLower)) {
                $hasQuestionWord = true;
                break;
            }
        }
        
        foreach ($availabilityKeywords as $keyword) {
            if (strpos($queryLower, $keyword) !== false) {
                $hasAvailabilityKeyword = true;
                break;
            }
        }
        
        // If it starts with a question word and has availability keywords, likely a general question
        if ($hasQuestionWord && $hasAvailabilityKeyword && !$this->hasSpecificSearchCriteria($queryLower)) {
            return true;
        }
        
        return false;
    }

    /**
     * Check if query has specific search criteria (location, type, price, etc.)
     * 
     * @param string $queryLower
     * @return bool
     */
    protected function hasSpecificSearchCriteria(string $queryLower): bool
    {
        $specificCriteria = [
            'bedroom', 'bathroom', 'garage', 'parking',
            'in ', 'at ', 'near ', 'quezon', 'makati', 'bgc', 'manila', 'cebu', 'davao',
            'condo', 'house', 'apartment', 'townhouse',
            'under', 'below', 'above', 'over', 'million', 'thousand',
            '₱', 'peso', 'price', 'cost',
            'listing', 'listings', 'latest', 'newest', 'recent', 'rentals',
        ];
        
        foreach ($specificCriteria as $criterion) {
            if (strpos($queryLower, $criterion) !== false) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check if a conversational query should trigger a property search
     * (e.g., "recommend me cozy apartments" should search for apartments)
     * 
     * @param string $query
     * @return bool
     */
    protected function shouldPerformSearchForConversational(string $query): bool
    {
        $queryLower = strtolower($query);
        
        // Keywords that suggest a search should be performed
        $searchIndicators = [
            'recommend', 'suggest', 'find', 'show', 'looking for',
            'want', 'need', 'search', 'looking', 'find me'
        ];
        
        // Property-related keywords
        $propertyKeywords = [
            'apartment', 'condo', 'house', 'property', 'properties',
            'listing', 'listings', 'rental', 'rentals',
            'unit', 'units', 'room', 'rooms',
            'home', 'homes',
            'bedroom', 'bathroom', 'location', 'area', 'price'
        ];
        
        $hasSearchIndicator = false;
        $hasPropertyKeyword = false;
        
        foreach ($searchIndicators as $indicator) {
            if (strpos($queryLower, $indicator) !== false) {
                $hasSearchIndicator = true;
                break;
            }
        }
        
        foreach ($propertyKeywords as $keyword) {
            if (strpos($queryLower, $keyword) !== false) {
                $hasPropertyKeyword = true;
                break;
            }
        }
        
        // If it has both search indicator and property keyword, perform search
        return $hasSearchIndicator && $hasPropertyKeyword;
    }

    /**
     * Determine if properties should be included in the response for a conversational query
     * Only returns true if the user explicitly asks to see properties or needs property data
     * 
     * @param string $query
     * @param array $conversationHistory
     * @return bool
     */
    protected function shouldIncludePropertiesInResponse(string $query, array $conversationHistory = []): bool
    {
        $queryLower = strtolower(trim($query));
        
        // Simple greetings that don't need properties
        $simpleGreetings = [
            'hello', 'hi', 'hey', 'good morning', 'good afternoon', 
            'good evening', 'greetings', 'howdy', 'sup', 'yo'
        ];
        
        // Check if it's just a simple greeting (exact match or starts with greeting)
        foreach ($simpleGreetings as $greeting) {
            if ($queryLower === $greeting || strpos($queryLower, $greeting . ' ') === 0) {
                // If it's just a greeting without any property-related context, don't include properties
                $queryWithoutGreeting = trim(str_replace($greeting, '', $queryLower));
                if (empty($queryWithoutGreeting) || strlen($queryWithoutGreeting) < 3) {
                    return false;
                }
            }
        }
        
        // Patterns that explicitly request to see properties (must have action verbs + property keywords)
        $explicitPropertyRequestPatterns = [
            '/\b(show|find|search|recommend|suggest|list|display|see|view|get|fetch)\s+(me\s+)?(any|some|available|all|the)?\s*(property|properties|apartment|condo|house|rental|rentals|listing|listings|unit|units|room|rooms|home|homes)/i',
            '/\b(what|which|where)\s+(property|properties|apartment|condo|house|rental|rentals|listing|listings|unit|units|room|rooms|home|homes)/i',
            '/\b(do\s+you\s+have|are\s+there|is\s+there)\s+(any|some|available)?\s*(property|properties|rental|rentals|listing|listings|unit|units|room|rooms|home|homes)/i',
            '/\b(any|some|available)\s+(property|properties|apartment|condo|house|rental|rentals|listing|listings|unit|units|room|rooms|home|homes)/i',
            '/\btell\s+me\s+about\s+(the\s+)?(property|properties|rental|rentals|listing|listings|unit|units|room|rooms|home|homes)/i',
            '/\bcan\s+you\s+(show|find|recommend|suggest|list)\s+(me\s+)?(any|some|available)?\s*(property|properties|rental|rentals|listing|listings|unit|units|room|rooms|home|homes)/i',
        ];
        
        foreach ($explicitPropertyRequestPatterns as $pattern) {
            if (preg_match($pattern, $queryLower)) {
                return true;
            }
        }
        
        // Check for general availability questions (these need property data for accurate answers)
        if ($this->isGeneralAvailabilityQuestion($query)) {
            return true;
        }
        
        // Check if query explicitly asks to see/search for specific properties with criteria
        // (e.g., "recommend me cozy apartments", "find 2 bedroom houses")
        if ($this->shouldPerformSearchForConversational($query)) {
            return true;
        }
        
        // Check conversation history - if previous messages explicitly asked for properties, include them
        if (!empty($conversationHistory)) {
            $lastFewMessages = array_slice($conversationHistory, -4); // Check last 4 messages
            foreach ($lastFewMessages as $message) {
                $content = strtolower($message['content'] ?? '');
                foreach ($explicitPropertyRequestPatterns as $pattern) {
                    if (preg_match($pattern, $content)) {
                        return true;
                    }
                }
            }
        }
        
        // Default: don't include properties for general conversation or help requests
        // Queries like "finding a property can you help me?" are just asking for help, not to see properties
        return false;
    }

    /**
     * Check if query needs general property data and fetch it if needed
     * 
     * @param string $query
     * @return array|null
     */
    protected function getGeneralPropertyDataIfNeeded(string $query): ?array
    {
        // Always fetch general data for conversational queries to provide accurate answers
        // This ensures Groq has real data to work with
        
        // Fetch general property data
        $totalAvailable = Property::whereNotNull('published_at')->count();
        $sampleProperties = Property::whereNotNull('published_at')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->toArray();
        
        return [
            'total_available' => $totalAvailable,
            'sample_properties' => $sampleProperties,
        ];
    }

    /**
     * Get AI-generated suggested prompts for the chat UI (e.g. "Show me 1-bedroom apartments").
     * No auth required. Uses backend AI provider (Gemini/Groq/OpenAI).
     */
    public function suggestedPrompts(): JsonResponse
    {
        \Illuminate\Support\Facades\Log::debug('[suggestedPrompts] Request received');
        $fallback = [
            'Show me 1-bedroom apartments',
            'Find properties under ₱20k',
            'Latest listings in Cebu City',
        ];
        try {
            $prompts = $this->groqService->generateSuggestedPrompts();
            \Illuminate\Support\Facades\Log::debug('[suggestedPrompts] AI success', ['count' => count($prompts), 'prompts' => $prompts]);
            return response()->json([
                'success' => true,
                'data' => [
                    'prompts' => $prompts,
                    'fromAI' => true,
                ],
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('[suggestedPrompts] Generation failed', [
                'message' => $e->getMessage(),
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'success' => true,
                'data' => [
                    'prompts' => $fallback,
                    'fromAI' => false,
                ],
            ]);
        }
    }

    /**
     * Generate a short property description from category and title (for create-listing form).
     * No auth required. Uses backend AI only; API keys stay in .env.
     */
    public function generatePropertyDescription(Request $request): JsonResponse
    {
        $request->validate([
            'category' => 'required|string|max:200',
            'title' => 'required|string|max:500',
        ]);

        try {
            $description = $this->groqService->generatePropertyDescription(
                $request->input('category'),
                $request->input('title')
            );
            return response()->json([
                'success' => true,
                'data' => $description,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Property description generation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Could not generate description. Please write one manually.',
            ], 422);
        }
    }

    /**
     * List all conversations for the current user
     */
    #[OA\Get(
        path: "/property/search/conversations",
        summary: "List all conversations",
        description: "Get a list of all conversations for the current user (or anonymous conversations if not authenticated)",
        tags: ["AI", "Properties"],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of conversations",
                content: new OA\JsonContent(
                    type: "array",
                    items: new OA\Items(type: "object")
                )
            ),
        ]
    )]
    public function listConversations(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $conversations = $this->conversationService->listConversations($userId);
        
        return response()->json($conversations);
    }

    /**
     * Get a specific conversation with messages
     */
    #[OA\Get(
        path: "/property/search/conversation/{conversationId}",
        summary: "Get conversation details",
        description: "Get a specific conversation with all messages and context",
        tags: ["AI", "Properties"],
        parameters: [
            new OA\Parameter(
                name: "conversationId",
                in: "path",
                required: true,
                description: "The conversation ID",
                schema: new OA\Schema(type: "string")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Conversation details",
                content: new OA\JsonContent(type: "object")
            ),
            new OA\Response(
                response: 404,
                description: "Conversation not found",
            ),
        ]
    )]
    public function getConversation(string $conversationId): JsonResponse
    {
        $conversation = Conversation::where('conversation_id', $conversationId)->first();
        
        if (!$conversation) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        $messages = $conversation->messages()->get()->map(function ($msg) {
            return [
                'id' => $msg->id,
                'role' => $msg->role,
                'content' => $msg->content,
                'metadata' => $msg->metadata,
                'created_at' => $msg->created_at,
            ];
        });

        $context = $this->conversationService->getConversationContext($conversation);

        return response()->json([
            'id' => $conversation->id,
            'conversation_id' => $conversation->conversation_id,
            'title' => $conversation->title,
            'messages' => $messages,
            'context' => $context,
            'created_at' => $conversation->created_at,
            'updated_at' => $conversation->updated_at,
        ]);
    }

    /**
     * Clear conversation context (keeps messages but clears stored context)
     */
    #[OA\Delete(
        path: "/property/search/conversation/{conversationId}/context",
        summary: "Clear conversation context",
        description: "Clear the stored context (preferences, facts) for a conversation while keeping message history",
        tags: ["AI", "Properties"],
        parameters: [
            new OA\Parameter(
                name: "conversationId",
                in: "path",
                required: true,
                description: "The conversation ID",
                schema: new OA\Schema(type: "string")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Context cleared successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean"),
                        new OA\Property(property: "message", type: "string"),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: "Conversation not found",
            ),
        ]
    )]
    public function clearConversationContext(string $conversationId): JsonResponse
    {
        $conversation = Conversation::where('conversation_id', $conversationId)->first();
        
        if (!$conversation) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        // Clear context (messages are kept for history, but context is cleared)
        $this->conversationService->clearContext($conversation);
        
        return response()->json([
            'success' => true,
            'message' => 'Conversation context cleared successfully',
        ]);
    }

    /**
     * Delete a conversation completely
     */
    #[OA\Delete(
        path: "/property/search/conversation/{conversationId}",
        summary: "Delete conversation",
        description: "Permanently delete a conversation and all its messages and context",
        tags: ["AI", "Properties"],
        parameters: [
            new OA\Parameter(
                name: "conversationId",
                in: "path",
                required: true,
                description: "The conversation ID to delete",
                schema: new OA\Schema(type: "string")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Conversation deleted successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean"),
                        new OA\Property(property: "message", type: "string"),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: "Conversation not found",
            ),
        ]
    )]
    public function deleteConversation(string $conversationId): JsonResponse
    {
        $conversation = Conversation::where('conversation_id', $conversationId)->first();
        
        if (!$conversation) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        $this->conversationService->deleteConversation($conversation);
        
        return response()->json([
            'success' => true,
            'message' => 'Conversation deleted successfully',
        ]);
    }

    /**
     * Build and execute the property query based on Groq-extracted criteria.
     * Handles all property table columns for comprehensive search.
     * Implements a fallback mechanism: if strict criteria return no results,
     * it tries again with relaxed criteria (location-only or type-only).
     */
    protected function queryProperties(array $criteria)
    {
        // First, try with strict criteria
        $properties = $this->buildPropertyQuery($criteria, $strict = true)->get();
        
        // If no results with strict criteria, try with relaxed criteria
        if ($properties->isEmpty()) {
            $properties = $this->buildPropertyQuery($criteria, $strict = false)->get();
        }
        
        return $properties;
    }

    /**
     * Build the property query with optional strict mode.
     * In strict mode, all criteria must match.
     * In relaxed mode, only location or property_type are required (whichever is available).
     */
    protected function buildPropertyQuery(array $criteria, bool $strict = true)
    {
        // Filter by published properties (available properties)
        $query = Property::query()->whereNotNull('published_at');

        // General text search - search in title and description for property names, keywords, etc.
        if (!empty($criteria['search_text'])) {
            $searchText = $this->formatFuzzySearch($criteria['search_text']);
            $query->where(function ($q) use ($searchText) {
                $q->where('title', 'LIKE', $searchText)
                  ->orWhere('description', 'LIKE', $searchText);
            });
        }

        // Location search - check city, state_province, country, street_address, title, and description
        // This allows finding properties by name (e.g., "Azure Residences") even if extracted as location
        if (!empty($criteria['location'])) {
            $locationSearch = $this->formatFuzzySearch($criteria['location']);
            $query->where(function ($q) use ($locationSearch) {
                $q->where('city', 'LIKE', $locationSearch)
                  ->orWhere('state_province', 'LIKE', $locationSearch)
                  ->orWhere('country', 'LIKE', $locationSearch)
                  ->orWhere('street_address', 'LIKE', $locationSearch)
                  ->orWhere('title', 'LIKE', $locationSearch)
                  ->orWhere('description', 'LIKE', $locationSearch);
            });
        }

        // Specific location fields (if extracted separately)
        if (!empty($criteria['country'])) {
            $query->where('country', 'LIKE', $this->formatFuzzySearch($criteria['country']));
        }

        if (!empty($criteria['state_province'])) {
            $query->where('state_province', 'LIKE', $this->formatFuzzySearch($criteria['state_province']));
        }

        if (!empty($criteria['city'])) {
            $query->where('city', 'LIKE', $this->formatFuzzySearch($criteria['city']));
        }

        if (!empty($criteria['street_address'])) {
            $query->where('street_address', 'LIKE', $this->formatFuzzySearch($criteria['street_address']));
        }

        // Property type filter (with normalization)
        // When searching by property name (location/search_text), skip property_type filter
        // to avoid filtering out properties when AI incorrectly infers type from property name
        if (!empty($criteria['property_type'])) {
            $propertyType = $this->normalizePropertyType($criteria['property_type']);
            $isSearchingByName = (!empty($criteria['location']) || !empty($criteria['search_text']));
            
            if ($strict) {
                // Strict mode: apply property type filter unless searching by name
                if (!$isSearchingByName) {
                    $query->where('type', $propertyType);
                }
            } else {
                // Relaxed mode: only apply property type if no location criteria exists
                // This allows finding properties by location even if type doesn't match exactly
                $hasLocationCriteria = !empty($criteria['location']) || 
                                      !empty($criteria['city']) || 
                                      !empty($criteria['state_province']) ||
                                      !empty($criteria['country']);
                
                if (!$hasLocationCriteria && !$isSearchingByName) {
                    // No location specified, so property type is the main criteria
                    $query->where('type', $propertyType);
                }
                // If location exists, prioritize location over property type in relaxed mode
            }
        }

        // Listing type filter (for_rent / for_sale) — applied in both strict and relaxed mode
        // Default to "for_rent" if not specified
        $listingType = !empty($criteria['listing_type']) ? $criteria['listing_type'] : 'for_rent';
        $query->where('listing_type', $listingType);

        // Price filters (only in strict mode - skip in relaxed mode to allow more results)
        if ($strict) {
            // Handle exact price match (when user specifies "price of X")
            if (!empty($criteria['exact_price'])) {
                // Allow a small tolerance for floating point comparison (within 0.01 peso for exact matches)
                $exactPrice = (float) $criteria['exact_price'];
                // Use CAST to ensure proper decimal comparison
                $query->whereRaw('CAST(price AS DECIMAL(10,2)) BETWEEN ? AND ?', [
                    $exactPrice - 0.01,
                    $exactPrice + 0.01
                ]);
            } else {
                // Range-based price filters
                if (!empty($criteria['min_price'])) {
                    $query->whereRaw('CAST(price AS DECIMAL(10,2)) >= ?', [(float) $criteria['min_price']]);
                }

                if (!empty($criteria['max_price'])) {
                    $query->whereRaw('CAST(price AS DECIMAL(10,2)) <= ?', [(float) $criteria['max_price']]);
                }
            }

            // Price type filter
            if (!empty($criteria['price_type'])) {
                $priceType = ucfirst(strtolower($criteria['price_type']));
                $query->where('price_type', $priceType);
            }

            // Bedrooms filter
            if (!empty($criteria['bedrooms'])) {
                $query->where('bedrooms', '>=', $criteria['bedrooms']);
            }

            // Bathrooms filter
            if (!empty($criteria['bathrooms'])) {
                $query->where('bathrooms', '>=', $criteria['bathrooms']);
            }

            // Garage/Parking filter
            if (!empty($criteria['garage'])) {
                $query->where('garage', '>=', $criteria['garage']);
            }

            // Area filter (using 'area' field which stores sqm)
            if (!empty($criteria['min_area_sqm'])) {
                $query->where('area', '>=', $criteria['min_area_sqm']);
            }

            // Lot area filter
            if (!empty($criteria['min_lot_area_sqm'])) {
                $query->where('lot_area', '>=', $criteria['min_lot_area_sqm']);
            }

            // Floor area unit filter
            if (!empty($criteria['floor_area_unit'])) {
                $query->where('floor_area_unit', 'LIKE', "%{$criteria['floor_area_unit']}%");
            }

            // Furnishing filter
            if (!empty($criteria['furnishing'])) {
                $furnishing = $this->normalizeFurnishing($criteria['furnishing']);
                $query->where('furnishing', $furnishing);
            }

            // Amenities filter - check if any of the requested amenities exist in the property's amenities array
            if (!empty($criteria['amenities']) && is_array($criteria['amenities'])) {
                $query->where(function ($q) use ($criteria) {
                    foreach ($criteria['amenities'] as $amenity) {
                        $normalizedAmenity = $this->normalizeAmenity($amenity);
                        // Try multiple variations to match database format
                        $variations = [
                            $normalizedAmenity,
                            ucfirst(strtolower($normalizedAmenity)),
                            strtolower($normalizedAmenity),
                            strtoupper($normalizedAmenity),
                        ];
                        
                        $q->orWhere(function ($subQ) use ($variations) {
                            foreach ($variations as $variation) {
                                $subQ->orWhereJsonContains('amenities', $variation);
                            }
                        });
                    }
                });
            }

            // Featured property filter
            if (isset($criteria['is_featured']) && $criteria['is_featured'] !== null) {
                $query->where('is_featured', (bool) $criteria['is_featured']);
            }
        }
        // In relaxed mode, we skip price, bedrooms, bathrooms, amenities, etc.
        // to allow more flexible matching based on location or property type

        // Order by newest first when user asked for "latest/new/recent" listings
        if (!empty($criteria['sort_by']) && $criteria['sort_by'] === 'newest') {
            $query->orderByDesc('published_at')->orderByDesc('created_at');
        } else {
            $query->orderBy('price', 'asc');
        }

        return $query->limit(10);
    }
 
    /**
     * Format a search term for fuzzy LIKE matching.
     * Replaces spaces and underscores with % wildcards.
     */
    protected function formatFuzzySearch(string $term): string
    {
        // Replace spaces, underscores, and hyphens with % for flexible matching
        $fuzzy = str_replace([' ', '_', '-'], '%', trim($term));
        // Remove consecutive % to keep it clean
        $fuzzy = preg_replace('/%+/u', '%', $fuzzy);
        return "%{$fuzzy}%";
    }

    /**
     * Normalize property type to match database values
     */
    protected function normalizePropertyType(string $type): string
    {
        $normalized = strtolower(trim($type));
        $mapping = [
            'condo' => 'Condominium',
            'condominium' => 'Condominium',
            'apartment' => 'Apartment',
            'house' => 'House',
            'townhouse' => 'Townhouse',
            'commercial' => 'Commercial Spaces',
            'commercial space' => 'Commercial Spaces',
            'commercial spaces' => 'Commercial Spaces',
            'lot' => 'Lot',
            'land' => 'Lot',
        ];

        return $mapping[$normalized] ?? ucfirst($type);
    }

    /**
     * Normalize furnishing type to match database values
     */
    protected function normalizeFurnishing(string $furnishing): string
    {
        $normalized = strtolower(trim($furnishing));
        $mapping = [
            'furnished' => 'Furnished',
            'semi-furnished' => 'Semi-Furnished',
            'semi furnished' => 'Semi-Furnished',
            'unfurnished' => 'Unfurnished',
        ];

        return $mapping[$normalized] ?? ucfirst($furnishing);
    }

    /**
     * Normalize amenity names to match database values
     */
    protected function normalizeAmenity(string $amenity): string
    {
        $normalized = strtolower(trim($amenity));
        $mapping = [
            'pool' => 'Swimming Pool',
            'swimming pool' => 'Swimming Pool',
            'parking' => 'Parking',
            'garage' => 'Parking',
            'gym' => 'Gym',
            'fitness' => 'Gym',
            'security' => 'Security',
            'elevator' => 'Elevator',
            'garden' => 'Garden',
            'rooftop' => 'Rooftop Garden',
            'rooftop garden' => 'Rooftop Garden',
            'concierge' => 'Concierge',
            'maid' => "Maid's Room",
            'maids room' => "Maid's Room",
            'maid room' => "Maid's Room",
        ];

        return $mapping[$normalized] ?? ucfirst($amenity);
    }
}


