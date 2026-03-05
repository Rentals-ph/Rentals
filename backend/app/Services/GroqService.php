<?php

namespace App\Services;

use OpenAI;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class GroqService
{
    protected $client;
    protected string $model;
    protected string $provider;
    protected string $apiKey;
    protected string $baseUrl;

    public function __construct()
    {
        // Determine which AI provider to use (groq, gemini, openai)
        $this->provider = strtolower(env('AI_PROVIDER', 'gemini'));
        $this->apiKey = env('GEMINI_API_KEY', env('GROQ_API_KEY', env('OPENAI_API_KEY', '')));
        

        if ($this->provider === 'groq' || $this->provider === 'openai') {
            // Use OpenAI-compatible client for Groq or OpenAI
            $baseUri = $this->provider === 'groq' 
                ? 'https://api.groq.com/openai/v1'
                : 'https://api.openai.com/v1';
            
            $apiKey = $this->provider === 'groq' 
                ? env('GROQ_API_KEY', $this->apiKey)
                : env('OPENAI_API_KEY', $this->apiKey);

            // Configure HTTP client for Windows SSL compatibility
            $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
            $verifySSL = env('HTTP_VERIFY_SSL', $isWindows ? 'false' : 'true');
            $verifySSL = filter_var($verifySSL, FILTER_VALIDATE_BOOLEAN);
            
            $httpClient = new \GuzzleHttp\Client([
                'verify' => $verifySSL,
                'timeout' => 60,
                'connect_timeout' => 10,
            ]);

            $this->client = OpenAI::factory()
                ->withApiKey($apiKey)
                ->withBaseUri($baseUri)
                ->withHttpClient($httpClient)
                ->make();

            $this->model = $this->provider === 'groq'
                ? env('GROQ_MODEL', 'llama-3.3-70b-versatile')
                : env('OPENAI_MODEL', 'gpt-4o-mini');
        } else {
            // Gemini configuration
            $this->model = env('GEMINI_MODEL', 'gemini-2.0-flash');
            $this->baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        }
    }

    /**
     * Make a request to Gemini API
     */
    protected function makeGeminiRequest(array $messages, float $temperature = 0.7, int $maxTokens = 1000, ?string $responseFormat = null): array
    {
        try {
            // Convert OpenAI-style messages to Gemini format
            $contents = [];
            $systemInstruction = null;

            foreach ($messages as $message) {
                $role = $message['role'] ?? 'user';
                $content = $message['content'] ?? '';

                if ($role === 'system') {
                    $systemInstruction = $content;
                } else {
                    $contents[] = [
                        'role' => $role === 'assistant' ? 'model' : 'user',
                        'parts' => [['text' => $content]]
                    ];
                }
            }

            $requestBody = [
                'contents' => $contents,
            ];

            if ($systemInstruction) {
                $requestBody['systemInstruction'] = [
                    'parts' => [['text' => $systemInstruction]]
                ];
            }

            $generationConfig = [
                'temperature' => $temperature,
                'maxOutputTokens' => $maxTokens,
            ];

            if ($responseFormat === 'json_object') {
                $generationConfig['responseMimeType'] = 'application/json';
            }

            $requestBody['generationConfig'] = $generationConfig;

            $url = "{$this->baseUrl}/{$this->model}:generateContent?key={$this->apiKey}";

            // Configure HTTP client with SSL settings for Windows compatibility
            $httpClient = $this->getHttpClient();
            $response = $httpClient->post($url, $requestBody);

            if (!$response->successful()) {
                Log::error('Gemini API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new Exception('Gemini API request failed: ' . $response->status());
            }

            $data = $response->json();

            // Extract text from Gemini response
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

            // Return in OpenAI-compatible format
            return [
                'choices' => [
                    [
                        'message' => [
                            'content' => $text,
                        ],
                    ],
                ],
            ];

        } catch (Exception $e) {
            Log::error('Gemini API call failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Unified chat method that works with any provider
     */
    protected function makeChatRequest(array $messages, float $temperature = 0.7, int $maxTokens = 1000, ?string $responseFormat = null): array
    {
        if ($this->provider === 'gemini') {
            return $this->makeGeminiRequest($messages, $temperature, $maxTokens, $responseFormat);
        } else {
            // Use OpenAI-compatible client (Groq or OpenAI)
            $params = [
                'model' => $this->model,
                'messages' => $messages,
                'temperature' => $temperature,
                'max_tokens' => $maxTokens,
            ];

            if ($responseFormat === 'json_object') {
                $params['response_format'] = ['type' => 'json_object'];
            }

            $response = $this->client->chat()->create($params);
            
            // Convert OpenAI response object to array format (matching Gemini format)
            return [
                'choices' => [
                    [
                        'message' => [
                            'content' => $response->choices[0]->message->content ?? '',
                        ],
                    ],
                ],
            ];
        }
    }


    /**
     * GROQ FUNCTION 1
     * Analyze the user's natural language query and extract structured search
     * criteria as a JSON object for database querying.
     *
     * @param string $userQuery
     * @return array
     */
    public function parseUserQuery(string $userQuery): array
    {
        try {
            $response = $this->makeChatRequest([
                    [
                        'role'    => 'system',
                        'content' => <<<PROMPT
You are Rentals Assist, a real estate search assistant for the Philippines.
Your job is to extract ALL search criteria from a user's natural language query that relates to ANY property field.

Return ONLY a valid JSON object with the following fields (extract ANYTHING mentioned in the query):
- location          (string or null)  — city, area, neighborhood, or property name (e.g. "Quezon City", "BGC", "Azure Residences")
- property_type     (string or null)  — property type: "House", "Condominium", "Apartment", "Townhouse", "Commercial Spaces", "Lot", etc.
- exact_price       (number or null)  — exact price when user says "price of X" or "costing X" (use this instead of min_price/max_price for exact matches)
- min_price         (number or null)  — minimum price in Philippine Peso (no currency symbols) - use for "under X", "below X", "at least X"
- max_price         (number or null)  — maximum price in Philippine Peso (no currency symbols) - use for "under X", "below X", "up to X"
- price_type        (string or null)  — "monthly", "yearly", "daily", or null
- bedrooms          (number or null)  — minimum number of bedrooms
- bathrooms         (number or null)  — minimum number of bathrooms
- garage            (number or null)  — minimum number of parking spaces/garage
- min_area_sqm      (number or null)  — minimum floor area in square meters
- min_lot_area_sqm  (number or null)  — minimum lot area in square meters
- floor_area_unit   (string or null)  — area unit mentioned (e.g. "Square Meters", "Square Feet")
- amenities         (array or null)   — list of amenities mentioned (e.g. ["pool", "parking", "gym", "swimming pool", "security"])
- furnishing        (string or null)  — "Furnished", "Semi-Furnished", "Unfurnished", or null
- country           (string or null)  — country name (e.g. "Philippines")
- state_province    (string or null)  — state or province (e.g. "Metro Manila", "Cebu")
- city              (string or null)  — city name (e.g. "Manila", "Makati", "Quezon City")
- street_address    (string or null)  — street address or landmark
- is_featured       (boolean or null) — true if user wants featured properties, false if not, null if not mentioned
- search_text       (string or null)  — any general text to search in title or description (property names, keywords, etc.)
- sort_by           (string or null)  — "newest" when user says latest/newest/new/recent/fresh listings or properties (order by newest first); otherwise null

Rules:
- Return null for any field not mentioned or unclear
- IMPORTANT: When user says "price of X", "costing X", or "for X", use exact_price (NOT min_price). Only use min_price/max_price for range queries like "under X", "above X", "between X and Y"
- Convert price shorthand: "5M" = 5000000, "500K" = 500000, "8 million" = 8000000
- For small numbers like "1200", "1200.0", "1,200" - keep them as-is (1200), do NOT multiply by 1000
- Extract property names, building names, or landmarks as "location" or "search_text"
- CRITICAL: Always use spaces for multi-word strings in values (e.g. "Cebu City", NOT "Cebu_City" or "CebuCity").
- CRITICAL: Do NOT infer property_type from property names. Only set property_type if user explicitly mentions a type (e.g., "condo", "house", "apartment"). Property names like "Azure Residences" or "BGC Tower" should NOT set property_type.
- Normalize property types to match database values (e.g. "condo" → "Condominium", "house" → "House")
- Normalize amenities to common terms (e.g. "pool" → "Swimming Pool", "parking" → "Parking")
- If user mentions a property name or building name, include it in both "location" and "search_text"
- For "Latest listings in Cebu City", "New listings in Manila", etc.: set location and/or city to the place (e.g. "Cebu City", "Manila") and set sort_by to "newest"
- When user says "latest", "newest", "new", "recent", or "fresh" in relation to listings/properties/rentals, set sort_by to "newest"
- Do not include any explanation or text outside the JSON object
PROMPT
                    ],
                    [
                        'role'    => 'user',
                        'content' => $userQuery,
                    ],
                ], 0.1, 1000, 'json_object');

            $parsed = json_decode($response['choices'][0]['message']['content'], true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::warning('Groq parseUserQuery: Invalid JSON returned', [
                    'raw' => $response['choices'][0]['message']['content'],
                ]);
                return [];
            }

            return $parsed;

        } catch (Exception $e) {
            Log::error('Groq parseUserQuery failed: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * GROQ FUNCTION 2
     * Given the original user query and the matching properties fetched from
     * the database, generate a natural language recommendation response.
     *
     * @param string $userQuery
     * @param array  $properties
     * @param array|null $conversationContext Conversation context (preferences, facts, etc.)
     * @return string
     */
    public function generatePropertyResponse(string $userQuery, array $properties, ?array $conversationContext = null): string
    {
        try {
            $count          = count($properties);
            
            // Optimize property data for AI (reduce token usage)
            $minimalProperties = array_map(function($prop) {
                return [
                    'id' => $prop['id'] ?? null,
                    'title' => $prop['title'] ?? 'N/A',
                    'type' => $prop['type'] ?? 'N/A',
                    'price' => $prop['price'] ?? 0,
                    'price_type' => $prop['price_type'] ?? 'Monthly',
                    'city' => $prop['city'] ?? 'N/A',
                    'location' => ($prop['street_address'] ?? '') . ', ' . ($prop['city'] ?? ''),
                    'bedrooms' => $prop['bedrooms'] ?? 0,
                    'bathrooms' => $prop['bathrooms'] ?? 0,
                    'description' => isset($prop['description']) ? substr($prop['description'], 0, 150) . '...' : null,
                ];
            }, $properties);

            $propertiesJson = json_encode($minimalProperties, JSON_PRETTY_PRINT);

            // Build context information if available
            $contextInfo = '';
            if ($conversationContext) {
                $contextInfo = $this->formatContextForPrompt($conversationContext);
            }

            $response = $this->makeChatRequest([
                    [
                        'role'    => 'system',
                        'content' => <<<PROMPT
You are Rentals Assist, a professional real estate assistant in the Philippines.
You will be given a user's search query and a list of available properties in JSON format.

Your responsibilities:
1. Provide helpful and friendly property recommendations based on the user's request
2. Highlight key features (price, location, bedrooms, amenities) in a structured manner
3. Be warm, helpful, and enthusiastic - focus on helping the user find what they need
4. If properties are found, present them positively and helpfully - even if they don't match ALL criteria exactly
5. If no properties are found, be helpful and suggest alternatives or ask clarifying questions
6. Always format prices in Philippine Peso (₱) with commas
7. Use conversation context (preferences, past searches) to personalize recommendations appropriately

Important guidelines:
- When showing properties, be positive and helpful - focus on what matches their search
- If properties don't match all criteria exactly, you can mention it briefly but still present them as good options
- Don't be overly formal or apologetic - be helpful and solution-oriented
- Use proper spacing between property listings (add blank lines between each property)
- Structure each property recommendation with clear spacing and organization
- Be conversational and friendly while remaining professional

Keep your response under 300 words unless more detail is needed.
PROMPT
                    ],
                    [
                        'role'    => 'user',
                        'content' => ($contextInfo ? "Context from previous conversations:\n{$contextInfo}\n\n" : '') . 
                                    "User's request: {$userQuery}\n\nFound {$count} matching properties:\n{$propertiesJson}",
                    ],
                ], 0.7, 600);

            return $response['choices'][0]['message']['content'];

        } catch (Exception $e) {
            Log::error('Groq generatePropertyResponse failed: ' . $e->getMessage());
            return 'I was unable to process your request at this time. Please try again.';
        }
    }

    /**
     * GROQ FUNCTION 4
     * Context-aware conversational response that understands previous search context
     * and can provide different types of responses (recommendations, confirmations, insights, etc.)
     *
     * @param string $userQuery Current user query
     * @param array $conversationHistory Previous messages in the conversation
     * @param array|null $lastSearchProperties Properties from the last search (if any)
     * @param array|null $generalPropertyData General property data (count, availability info, etc.) for answering general questions
     * @param array|null $conversationContext Conversation context (preferences, facts, etc.)
     * @return string
     */
    public function generateConversationalResponse(
        string $userQuery,
        array $conversationHistory = [],
        ?array $lastSearchProperties = null,
        ?array $generalPropertyData = null,
        ?array $conversationContext = null
    ): string {
        try {
            $messages = [];
            
            // Build system prompt that gives Groq freedom to respond contextually
            $hasPropertyData = ($lastSearchProperties && count($lastSearchProperties) > 0) || 
                               ($generalPropertyData && !empty($generalPropertyData['sample_properties']));
            
            $systemPrompt = <<<PROMPT
You are Rentals Assist, a professional, friendly, and intelligent real estate assistant in the Philippines.
You engage in natural, conversational interactions with users about property searches.

Your capabilities:
1. **Property Recommendations** - When user searches for properties AND property data is provided, provide helpful recommendations
2. **Confirmations** - When user asks if recommendations are good/okay, confirm and provide insights
3. **Follow-up Questions** - Answer questions about previously shown properties
   - **CRITICAL**: When properties are listed in the context, the user can reference them with phrases like:
     - "these properties", "the properties you showed", "the 6 properties", "the cheapest one", etc.
   - You MUST acknowledge and reference the specific properties from the context when answering
   - If user asks about "the cheapest" or "the most expensive", compare the prices from the provided properties
   - If user asks about specific features, reference the properties that match
4. **General Availability Questions** - Answer questions like "Are there available properties?" or "Is there anything available today?"
   - If general property data is provided, use it to answer accurately
   - Be enthusiastic and helpful: "Yes! We have [X] properties available. Would you like to see some options?"
   - Offer to help them find specific properties: "Are you interested in a particular area or type?"
5. **General Chat & Greetings** - For simple greetings like "hello" or "hi", respond warmly and naturally
   - Do NOT mention properties unless the user explicitly asks about them
   - Simply greet them back and ask how you can help
   - Example: "Hello! How can I help you today?" (NOT "Hello! We have properties available...")
   - **IMPORTANT: Do NOT add explanatory notes or meta-commentary about why you're not mentioning properties. Just respond naturally.**
6. **Insights & Advice** - Provide market insights, tips, or advice when appropriate

Response Guidelines:
- Be natural, conversational, and helpful
- Adapt your response style to the user's query type
- **CRITICAL: If properties are provided in the context, you MUST acknowledge them when the user references them**
- **CRITICAL: When user says "these properties", "the properties you showed", or similar, they are referring to the properties listed in the context - use those exact properties**
- **CRITICAL: If no property data is provided in the context, do NOT mention properties or availability**
- **CRITICAL: Do NOT add notes, explanations, or meta-commentary about context or why you're responding a certain way. Just respond naturally as if you're having a normal conversation.**
- For simple greetings without property context, just respond warmly and ask how you can help
- If user asks about previous recommendations, reference the context naturally and specifically
- If user asks general availability questions AND property data is provided, use it to answer accurately
- Always format prices in Philippine Peso (₱) with commas
- Be concise but thorough - match the user's communication style
- You have full freedom to respond appropriately - don't force recommendations if the query doesn't need them
- For yes/no questions, provide clear answers and follow up with helpful offers

Remember: You're having a conversation, not just providing search results. Be engaging, helpful, and proactive! When properties are provided in context, you MUST be able to reference them accurately when the user asks about them.
PROMPT;

            $messages[] = [
                'role' => 'system',
                'content' => $systemPrompt,
            ];

            // Add conversation history
            foreach ($conversationHistory as $message) {
                $messages[] = [
                    'role' => $message['role'] ?? 'user',
                    'content' => $message['content'] ?? '',
                ];
            }

            // Add conversation context if available
            $contextInfo = '';
            if ($conversationContext) {
                $contextInfo = "\n\n[Conversation Context - Remember these details about the user:\n";
                $contextInfo .= $this->formatContextForPrompt($conversationContext);
                $contextInfo .= "]";
            }

            // Add context about properties (could be current or previous)
            if ($lastSearchProperties && count($lastSearchProperties) > 0) {
                $contextInfo .= "\n\n[Properties Available/Previously Shown: We have " . count($lastSearchProperties) . " properties. ";
                $contextInfo .= "Here are the details:\n";
                foreach ($lastSearchProperties as $prop) {
                    $price = isset($prop['price']) ? number_format((float)$prop['price'], 2) : 'N/A';
                    $priceType = $prop['price_type'] ?? 'monthly';
                    $description = isset($prop['description']) ? substr($prop['description'], 0, 200) : '';
                    $contextInfo .= "- " . ($prop['title'] ?? 'Property') . " in " . ($prop['city'] ?? 'N/A') . 
                                   " - ₱" . $price . "/" . $priceType . 
                                   " (" . ($prop['bedrooms'] ?? 'N/A') . "BR, " . ($prop['bathrooms'] ?? 'N/A') . "BA)";
                    if ($description) {
                        $contextInfo .= " - Description: " . $description . (strlen($prop['description'] ?? '') > 200 ? '...' : '');
                    }
                    $contextInfo .= "\n";
                }
                $contextInfo .= "\nIMPORTANT: If the user asks about 'these properties', 'the properties you showed', or refers to specific properties, they are referring to the properties listed above. Use this information to answer their questions accurately.]";
            }

            // Add general property availability data if provided (for answering general questions)
            if ($generalPropertyData) {
                $generalInfo = "\n\n[General Property Information: ";
                if (isset($generalPropertyData['total_available'])) {
                    $generalInfo .= "There are currently " . $generalPropertyData['total_available'] . " available properties in the database. ";
                }
                if (isset($generalPropertyData['sample_properties']) && count($generalPropertyData['sample_properties']) > 0) {
                    $generalInfo .= "Here are some examples:\n";
                    foreach (array_slice($generalPropertyData['sample_properties'], 0, 3) as $prop) {
                        $generalInfo .= "- " . ($prop['title'] ?? 'Property') . " in " . ($prop['city'] ?? 'N/A') . 
                                       " - ₱" . number_format($prop['price'] ?? 0, 2) . "\n";
                    }
                }
                $generalInfo .= "]";
                $contextInfo .= $generalInfo;
            }

            // Add current user query
            $messages[] = [
                'role' => 'user',
                'content' => $userQuery . $contextInfo,
            ];

            $response = $this->makeChatRequest($messages, 0.8, 800);

            return $response['choices'][0]['message']['content'];

        } catch (Exception $e) {
            Log::error('Groq generateConversationalResponse failed: ' . $e->getMessage());
            return 'I apologize, but I encountered an issue processing your message. Could you please try again?';
        }
    }

    /**
     * Determine if a query is a search query or a conversational follow-up
     *
     * @param string $query
     * @return array ['is_search' => bool, 'confidence' => float]
     */
    public function analyzeQueryIntent(string $query): array
    {
        try {
            $response = $this->makeChatRequest([
                    [
                        'role' => 'system',
                        'content' => <<<PROMPT
You are analyzing user queries to determine if they are:
1. A NEW property search query (user wants to search for specific properties with criteria)
2. A CONVERSATIONAL/GENERAL question (user is asking general questions, about availability, confirming, asking questions, etc.)

Examples of SEARCH queries (user wants to find specific properties):
- "3 bedroom house in Quezon City"
- "Find apartments under 50k in Makati"
- "Show me properties with pool"
- "Azure Residences"
- "condo in BGC with parking"
- "can you find me apartment" (user is requesting to search for apartments)
- "find me a house" (user is requesting to search for houses)
- "I need a 2BR condo" (user is requesting to search)
- "looking for apartments" (user is requesting to search)
- "Latest listings in Cebu City" = SEARCH (user wants to see newest properties in that city)
- "New listings in Manila" = SEARCH
- "Recent listings in Makati" = SEARCH
- "Newest properties in Davao" = SEARCH
- "Show me the latest rentals in Quezon City" = SEARCH
- Any phrase like "latest/new/newest/recent listings (in|at) [city/place]" or "newest properties in [place]" = SEARCH
- Any request that asks to "find", "search", "show", "get", "need", "looking for" a property type or specific criteria = SEARCH

Examples of CONVERSATIONAL/GENERAL queries (NOT searches):
- "Is there available properties today?" (general availability question)
- "Are there any properties available?" (general availability question)
- "Do you have properties?" (general availability question)
- "Is that recommendation good?" (follow-up question about previous results)
- "Tell me more about those properties" (follow-up question about previous results)
- "What do you think?" (opinion question)
- "Yes, that's fine" (confirmation)
- "Are there any other options?" (follow-up question)
- "What properties do you have?" (general question without search intent)
- General questions about availability, existence, or asking for information without search intent

IMPORTANT RULES:
- "Latest listings in [city]", "New listings in [city]", "Recent listings in [city]", "newest properties in [city]" are ALWAYS SEARCH (confidence 1.0)
- Requests to "find", "search", "show", "get", "need", "looking for" a property type = SEARCH
- Questions about general availability (e.g., "is there", "are there", "do you have") WITHOUT search intent are CONVERSATIONAL
- Questions asking "what properties" without specific criteria are CONVERSATIONAL
- Follow-up questions about previously shown properties are CONVERSATIONAL
- Only classify as SEARCH if user is actively requesting to search/find properties with criteria (location, type, price, etc.)
- When in doubt between general question and search, prefer CONVERSATIONAL

Return ONLY a JSON object with:
- "is_search" (boolean): true if it's a search query, false if conversational/general
- "confidence" (number 0-1): how confident you are in this classification
PROMPT
                    ],
                    [
                        'role' => 'user',
                        'content' => $query,
                    ],
                ], 0.1, 1000, 'json_object');

            $result = json_decode($response['choices'][0]['message']['content'], true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                // Default to search if we can't parse
                return ['is_search' => true, 'confidence' => 0.5];
            }

            return [
                'is_search' => (bool) ($result['is_search'] ?? true),
                'confidence' => (float) ($result['confidence'] ?? 0.5),
            ];

        } catch (Exception $e) {
            Log::error('Groq analyzeQueryIntent failed: ' . $e->getMessage());
            // Default to search on error
            return ['is_search' => true, 'confidence' => 0.5];
        }
    }

    /**
     * GROQ FUNCTION 3
     * General chat/prompt functionality for any AI conversation.
     * Allows users to send custom prompts and get AI responses.
     *
     * @param string $prompt
     * @param string|null $systemPrompt
     * @param float $temperature
     * @param int $maxTokens
     * @return string
     */
    public function chat(string $prompt, ?string $systemPrompt = null, float $temperature = 0.7, int $maxTokens = 1000): string
    {
        try {
            $messages = [];

            // Add system prompt if provided, otherwise use default
            if ($systemPrompt) {
                $messages[] = [
                    'role'    => 'system',
                    'content' => $systemPrompt,
                ];
            } else {
                $messages[] = [
                    'role'    => 'system',
                    'content' => 'You are Rentals Assist, a friendly and helpful AI assistant. You can help with real estate questions about properties in the Philippines, but you should respond naturally to general conversation and greetings without forcing property recommendations. Only suggest or recommend properties when the user explicitly asks about properties, searches for properties, or expresses interest in finding a property. For simple greetings like "hello" or "hi", respond warmly and ask how you can help, but do not automatically recommend properties. Do NOT add explanatory notes or meta-commentary about context or why you\'re responding a certain way. Just respond naturally as if you\'re having a normal conversation.',
                ];
            }

            // Add user prompt
            $messages[] = [
                'role'    => 'user',
                'content' => $prompt,
            ];

            $response = $this->makeChatRequest($messages, $temperature, $maxTokens, null);

            return $response['choices'][0]['message']['content'];

        } catch (Exception $e) {
            Log::error('Groq chat failed: ' . $e->getMessage());
            return 'I was unable to process your request at this time. Please try again.';
        }
    }

    /**
     * Generate 3 suggested search prompts for the chat UI.
     * Uses the same AI provider as chat (Gemini/Groq/OpenAI). Returns a JSON array of 3 strings.
     *
     * @return array<int, string>
     */
    public function generateSuggestedPrompts(): array
    {
        $providerKey = $this->provider === 'gemini' ? env('GEMINI_API_KEY') : ($this->provider === 'groq' ? env('GROQ_API_KEY') : env('OPENAI_API_KEY'));
        if (empty($providerKey)) {
            $keyName = $this->provider === 'gemini' ? 'GEMINI_API_KEY' : ($this->provider === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY');
            Log::warning('[suggestedPrompts] AI provider has no API key', ['provider' => $this->provider, 'env_key' => $keyName]);
            throw new Exception("AI suggested prompts require {$keyName} to be set in .env");
        }

        $systemPrompt = 'You are a rental property search assistant. Generate exactly 3 short, natural suggested questions a user might ask when searching for rental properties. Each should be concise (under 8 words). Return ONLY a valid JSON array of 3 strings, no explanation, no markdown. Example: ["Show me 1-bedroom apartments", "Find properties under ₱20k", "Latest listings in Cebu City"]';

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => 'Generate the 3 suggested questions now.'],
        ];

        $response = $this->makeChatRequest($messages, 0.6, 200, 'json_object');

        $content = trim($response['choices'][0]['message']['content'] ?? '');
        if ($content === '') {
            Log::warning('[suggestedPrompts] AI returned empty content');
            throw new Exception('AI returned an empty response for suggested prompts');
        }

        Log::debug('[suggestedPrompts] Raw AI content', ['content' => strlen($content) > 500 ? substr($content, 0, 500) . '...' : $content]);

        // Strip markdown code fences if present
        $content = preg_replace('/^```\w*\n?|\n?```$/u', '', $content);
        $content = trim($content);

        $decoded = json_decode($content, true);
        if (!is_array($decoded)) {
            Log::warning('[suggestedPrompts] Decoded is not array', ['json_error' => json_last_error_msg(), 'content_preview' => substr($content, 0, 200)]);
            throw new Exception('Expected JSON from AI for suggested prompts');
        }

        // Accept raw JSON array ["a","b","c"] or object like {"prompts": ["a","b","c"]} (common with json_object mode)
        $list = null;
        if ($this->isZeroIndexedArray($decoded) && count($decoded) >= 3) {
            $list = $decoded;
        } else {
            foreach ($decoded as $v) {
                if (is_array($v) && $this->isZeroIndexedArray($v) && count($v) >= 3) {
                    $list = $v;
                    break;
                }
            }
        }
        if ($list === null) {
            Log::warning('[suggestedPrompts] No array of 3+ items found in decoded', ['decoded_keys' => array_keys($decoded)]);
            throw new Exception('Expected JSON array of at least 3 strings from AI');
        }

        $prompts = array_values(array_filter(array_slice($list, 0, 3), function ($v) {
            return is_string($v) && $v !== '';
        }));

        if (count($prompts) < 3) {
            Log::warning('[suggestedPrompts] Fewer than 3 string items after filter', ['list' => $list, 'prompts_count' => count($prompts)]);
            throw new Exception('Expected at least 3 non-empty strings from AI');
        }

        return $prompts;
    }

    /**
     * Generate a short property description from category and title (for listing form).
     * Uses backend AI provider only; no API keys exposed to client.
     *
     * @param string $category e.g. "Apartment / Condo"
     * @param string $title    e.g. "2BR Condo in BGC"
     * @return string Plain text description, 3-4 sentences
     */
    public function generatePropertyDescription(string $category, string $title): string
    {
        $systemPrompt = 'You are a professional real estate copywriter for Rentals.ph, a Philippine rental property platform. Write compelling, concise property descriptions for rental listings. Keep it to 3-4 sentences. Be specific and professional. Do not use markdown formatting. Write in plain text only.';
        $userPrompt = "Write a rental property listing description for:\nCategory: {$category}\nTitle: {$title}\n\nThe description should highlight the property's appeal, mention potential amenities typical for this category, and encourage prospective tenants to schedule a viewing.";

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt],
        ];

        $response = $this->makeChatRequest($messages, 0.7, 300, null);
        $content = trim($response['choices'][0]['message']['content'] ?? '');

        if ($content === '') {
            throw new Exception('AI returned an empty property description');
        }

        return $content;
    }

    /**
     * Format conversation context for use in prompts
     */
    protected function formatContextForPrompt(array $context): string
    {
        $formatted = [];

        // Format preferences
        if (!empty($context['preferences'])) {
            $formatted[] = "User Preferences:";
            foreach ($context['preferences'] as $key => $value) {
                if (is_array($value)) {
                    $formatted[] = "  - {$key}: " . implode(', ', $value);
                } else {
                    $formatted[] = "  - {$key}: {$value}";
                }
            }
        }

        // Format facts
        if (!empty($context['facts'])) {
            $formatted[] = "Known Facts:";
            foreach ($context['facts'] as $key => $value) {
                if (is_array($value)) {
                    $formatted[] = "  - {$key}: " . implode(', ', $value);
                } else {
                    $formatted[] = "  - {$key}: {$value}";
                }
            }
        }

        // Format user info
        if (!empty($context['user_info'])) {
            $formatted[] = "User Information:";
            foreach ($context['user_info'] as $key => $value) {
                if (is_array($value)) {
                    $formatted[] = "  - {$key}: " . implode(', ', $value);
                } else {
                    $formatted[] = "  - {$key}: {$value}";
                }
            }
        }

        // Format property interests
        if (!empty($context['property_interests'])) {
            $formatted[] = "Property Interests:";
            foreach ($context['property_interests'] as $key => $value) {
                if (is_array($value)) {
                    $formatted[] = "  - {$key}: " . implode(', ', $value);
                } else {
                    $formatted[] = "  - {$key}: {$value}";
                }
            }
        }

        return implode("\n", $formatted);
    }

    /**
     * Check if array is a zero-indexed list (0, 1, 2, ...).
     * Accepts both PHP arrays [0=>,1=>,2=>] and JSON objects with string keys {"0":,"1":,"2":}.
     */
    protected function isZeroIndexedArray(array $arr): bool
    {
        $n = count($arr);
        if ($n === 0) {
            return true;
        }
        $keys = array_map('intval', array_keys($arr));
        sort($keys);
        return $keys === range(0, $n - 1);
    }

    /**
     * Get HTTP client with Windows-compatible SSL configuration
     */
    protected function getHttpClient()
    {
        $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
        $verifySSL = env('HTTP_VERIFY_SSL', $isWindows ? 'false' : 'true');
        $verifySSL = filter_var($verifySSL, FILTER_VALIDATE_BOOLEAN);
        
        return Http::withOptions([
            'verify' => $verifySSL,
            'timeout' => 60,
            'connect_timeout' => 10,
        ]);
    }
}

