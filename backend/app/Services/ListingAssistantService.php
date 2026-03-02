<?php

namespace App\Services;

use App\Models\ListingAssistantConversation;
use OpenAI;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class ListingAssistantService
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
                ? env('GROQ_MODEL')
                : env('OPENAI_MODEL');
        } else {
            // Gemini configuration
            $this->model = env('GEMINI_MODEL');
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
    protected function chat(array $messages, float $temperature = 0.7, int $maxTokens = 1000, ?string $responseFormat = null): array
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
     * Main method to parse agent's message and extract property data
     * 
     * @param string $message The agent's message
     * @param array $conversationHistory Previous messages
     * @param array $currentData Currently extracted data
     * @param array $skippedFields Fields explicitly skipped
     * @return array Contains: extracted_data, missing_fields, ai_response, skipped_fields
     */
    public function parseAgentMessage(
        string $message,
        array $conversationHistory = [],
        array $currentData = [],
        array $skippedFields = []
    ): array {
        try {
            // Step 1: Extract structured data from the message
            $extractionResult = $this->extractPropertyData($message, $conversationHistory, $currentData);
            
            // Merge new extraction with current data
            $mergedData = $this->mergeExtractedData($currentData, $extractionResult['extracted_data'] ?? []);
            
            // Handle skipped fields from extraction
            $newSkipped = $extractionResult['skipped_fields'] ?? [];
            $allSkipped = array_unique(array_merge($skippedFields, $newSkipped));
            
            // Step 2: Identify missing required fields
            $missingFields = $this->identifyMissingFields($mergedData, $allSkipped);
            
            // Step 3: Generate conversational AI response
            $aiResponse = $this->generateResponse(
                $message,
                $conversationHistory,
                $mergedData,
                $missingFields,
                $extractionResult['extracted_data'] ?? []
            );
            
            return [
                'extracted_data' => $mergedData,
                'missing_fields' => $missingFields,
                'ai_response' => $aiResponse,
                'skipped_fields' => $allSkipped,
                'newly_extracted' => $extractionResult['extracted_data'] ?? [],
            ];

        } catch (Exception $e) {
            Log::error('ListingAssistant parseAgentMessage failed: ' . $e->getMessage());
            return [
                'extracted_data' => $currentData,
                'missing_fields' => $this->identifyMissingFields($currentData, $skippedFields),
                'ai_response' => 'I\'m having trouble processing that. Could you please rephrase or provide the information differently?',
                'skipped_fields' => $skippedFields,
                'newly_extracted' => [],
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Extract property data from agent message using AI
     */
    protected function extractPropertyData(
        string $message,
        array $conversationHistory,
        array $currentData
    ): array {
        try {
            // Build conversation context for better extraction
            $contextJson = json_encode($currentData, JSON_PRETTY_PRINT);
            
            // Determine what field was being asked about from last assistant message
            $lastAssistantMsg = '';
            foreach (array_reverse($conversationHistory) as $msg) {
                if (($msg['role'] ?? '') === 'assistant') {
                    $lastAssistantMsg = $msg['content'] ?? '';
                    break;
                }
            }

            $systemPrompt = <<<PROMPT
You are a real estate listing assistant helping agents create property listings in the Philippines.
Your job is to extract property information from the agent's conversational input.

IMMUTABLE ALREADY-EXTRACTED DATA (DO NOT CHANGE THESE UNLESS AGENT EXPLICITLY SAYS TO UPDATE/CHANGE):
{$contextJson}

LAST ASSISTANT MESSAGE (provides context for what field the user might be answering):
"{$lastAssistantMsg}"

FIELD DEFINITIONS:
Required Fields:
- property_name (string): The listing title/name
- property_type (string): One of: house, condo, apartment, lot, commercial, townhouse, studio, bedspace, warehouse, office
- location (string): City or area (e.g., "Quezon City", "Makati", "BGC")
- price (number): Price in Philippine Peso (convert: "5M" = 5000000, "50k" = 50000)
- price_type (string): REQUIRED - One of: Monthly, Weekly, Daily, Yearly (e.g., "Monthly" for monthly rent, "Weekly" for weekly rent)
- bedrooms (number): Number of bedrooms - MUST be a plain integer (e.g., 2, not "2")
- bathrooms (number): Number of bathrooms - MUST be a plain integer (e.g., 1, not "1")

Optional Fields:
- address (string): Full street address
- area_sqm (number): Floor area in square meters
- lot_area_sqm (number): Lot area in square meters (for houses/lots)
- parking_slots (number): Number of parking spaces
- amenities (array): List like ["pool", "gym", "security", "garden", "parking"]
- furnishing_status (string): One of: unfurnished, semi_furnished, fully_furnished
- hoa_fee (number): Monthly HOA fee
- property_age (number): Years since construction
- floor_level (number): Floor level for condos/apartments
- title_type (string): Title type (TCT, CCT, etc.)
- status (string): One of: for_sale, for_rent, pre_selling

CRITICAL CONTEXT-AWARE EXTRACTION RULES:
1. CONTEXT MATTERS: If the last assistant message asked about a specific field and the user gives a short answer, that answer is for THAT FIELD:
   - Assistant asked "What type of property?" + User says "house" → property_type: "house"
   - Assistant asked "Which city or area?" + User says "Cebu" → location: "Cebu" (ONLY ask once, never ask again)
   - Assistant asked "How many bedrooms?" + User says "5" → bedrooms: 5 (integer, NOT "5")
   - Assistant asked "How many bathrooms?" + User says "3" → bathrooms: 3 (integer, NOT "3")
   - User says "2 beds 1 bath" → bedrooms: 2, bathrooms: 1
   - User says "two bedrooms" → bedrooms: 2
   - User says "3BR 2T&B" → bedrooms: 3, bathrooms: 2
   - Assistant asked "What's the price?" + User says "15000" → price: 15000
   - Assistant asked "property name?" + User says "My Home" → property_name: "My Home"
2. NEVER re-extract or change fields that are already in IMMUTABLE DATA unless user explicitly says "change", "update", or "actually it's"
3. Only extract NEW values from this message - don't repeat existing data
4. Convert price shorthand: "7.5M" = 7500000, "25k" = 25000, "8 million" = 8000000
5. Recognize room counts: "3BR" = 3 bedrooms, "2T&B" = 2 bathrooms, "bedroom" = bedrooms field, "bath" = bathrooms field
6. NUMBERS MUST BE INTEGERS: bedrooms, bathrooms, price must be returned as plain integers (2, not "2")
7. Philippine terms: "RFO" = ready for occupancy, "TCT" = title type, "T&B" = toilet & bath
8. When agent says "skip", "ignore", "leave blank" → add to skipped_fields

OUTPUT FORMAT (JSON only):
{
  "extracted_data": {
    // ONLY include fields mentioned in THIS message
    // Do NOT repeat fields already in IMMUTABLE DATA
    // Numbers MUST be integers: "bedrooms": 2 (not "bedrooms": "2")
  },
  "skipped_fields": [],
  "update_fields": []
}
PROMPT;

            $messages = [
                ['role' => 'system', 'content' => $systemPrompt],
            ];

            // Add recent conversation history for context (last 6 messages)
            $recentHistory = array_slice($conversationHistory, -6);
            foreach ($recentHistory as $msg) {
                $messages[] = [
                    'role' => $msg['role'] ?? 'user',
                    'content' => $msg['content'] ?? '',
                ];
            }

            $messages[] = [
                'role' => 'user',
                'content' => "Extract property information from this message: \"{$message}\"",
            ];

            $response = $this->chat($messages, 0.1, 1000, 'json_object');

            $result = json_decode($response['choices'][0]['message']['content'], true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::warning('ListingAssistant extraction: Invalid JSON', [
                    'raw' => $response['choices'][0]['message']['content'] ?? '',
                ]);
                return ['extracted_data' => [], 'skipped_fields' => []];
            }

            return $result;

        } catch (Exception $e) {
            Log::error('ListingAssistant extractPropertyData failed: ' . $e->getMessage());
            return ['extracted_data' => [], 'skipped_fields' => []];
        }
    }

    /**
     * Merge newly extracted data with existing data
     */
    protected function mergeExtractedData(array $currentData, array $newData): array
    {
        foreach ($newData as $key => $value) {
            // Only update if value is not null
            if ($value !== null) {
                // Handle array merging for amenities
                if ($key === 'amenities' && is_array($value)) {
                    $existing = $currentData[$key] ?? [];
                    $currentData[$key] = array_values(array_unique(array_merge($existing, $value)));
                } else {
                    $currentData[$key] = $value;
                }
            }
        }

        return $currentData;
    }

    /**
     * Identify which required fields are still missing
     */
    public function identifyMissingFields(array $currentData, array $skippedFields = []): array
    {
        $requiredFields = ListingAssistantConversation::REQUIRED_FIELDS;
        $missing = [];

        foreach ($requiredFields as $field) {
            // Skip fields that were explicitly skipped
            if (in_array($field, $skippedFields)) {
                continue;
            }

            // Check if field is missing, null, or empty
            if (!isset($currentData[$field]) || 
                $currentData[$field] === null || 
                $currentData[$field] === '') {
                $missing[] = $field;
            }
        }

        return $missing;
    }

    /**
     * Generate conversational AI response to the agent
     */
    protected function generateResponse(
        string $message,
        array $conversationHistory,
        array $currentData,
        array $missingFields,
        array $newlyExtracted
    ): string {
        try {
            // Deterministic follow-ups for simple cases to avoid LLM re-asking filled fields
            // If only price is missing, ask price directly
            if (count($missingFields) === 1 && $missingFields[0] === 'price') {
                return "What's the asking price?";
            }
            // If price is already filled and only price_type is missing, ONLY ask about price_type
            if (
                count($missingFields) === 1 &&
                $missingFields[0] === 'price_type' &&
                isset($currentData['price']) &&
                $currentData['price'] !== null &&
                $currentData['price'] !== ''
            ) {
                return "Okay! What type of price is this? (monthly, weekly, daily, or yearly?)";
            }

            $dataJson = json_encode($currentData, JSON_PRETTY_PRINT);
            $newJson = json_encode($newlyExtracted, JSON_PRETTY_PRINT);
            $missingJson = json_encode($missingFields);

            // Build a clear summary of what's already filled
            $filledSummary = [];
            foreach ($currentData as $key => $value) {
                if ($value !== null && $value !== '' && $value !== []) {
                    if ($key === 'price') {
                        $filledSummary[] = "{$key}: ₱" . number_format((float)$value);
                    } elseif (is_array($value)) {
                        // Handle nested arrays by converting to JSON if needed
                        $flatValues = array_map(function($v) {
                            return is_array($v) ? json_encode($v) : (string)$v;
                        }, $value);
                        $filledSummary[] = "{$key}: " . implode(', ', $flatValues);
                    } elseif (is_object($value)) {
                        $filledSummary[] = "{$key}: " . json_encode($value);
                    } else {
                        $filledSummary[] = "{$key}: " . (string)$value;
                    }
                }
            }
            $filledList = count($filledSummary) > 0 ? implode("\n", $filledSummary) : 'None yet';

            $systemPrompt = <<<PROMPT
You are a helpful real estate listing assistant in the Philippines.
You're helping an agent create a property listing by having a natural conversation.

=== ALREADY FILLED FIELDS (DO NOT ASK ABOUT THESE AGAIN) ===
{$filledList}

=== NEWLY EXTRACTED FROM THIS MESSAGE ===
{$newJson}

=== STILL MISSING REQUIRED FIELDS ===
{$missingJson}

RESPONSE RULES:
1. BRIEFLY acknowledge what was just provided (1 sentence max)
2. DO NOT re-confirm or re-ask about fields shown in "ALREADY FILLED FIELDS" above - these are already complete, NEVER ask about them again
3. DO NOT ask about required fields that are already filled - check the "ALREADY FILLED FIELDS" section and NEVER ask about those fields
4. If there are missing REQUIRED fields, ask about ONLY THE FIRST ONE in the missing list
5. Keep your response SHORT - under 50 words
6. When ALL required fields are filled (missing list is empty or is "[]"), say: "Your listing is complete! Click 'Generate AI Description' to create a professional description, then submit your listing."
7. If the user provided an optional field value (like parking_slots, hoa_fee, etc.), just acknowledge it briefly and move on - DO NOT ask about required fields that are already filled

HANDLING USER QUESTIONS:
- If user asks "what's missing?" or "what do I need?" - LIST the fields in the STILL MISSING REQUIRED FIELDS section
- If user asks about status/progress - summarize filled fields and list missing ones
- If user asks a question, ANSWER IT directly - don't just say "noted"

REQUIRED FIELDS ONLY (these are the ONLY fields you should ask about):
- property_name: "What would you like to name this listing?"
- property_type: "What type of property is this? (house, condo, apartment, townhouse, studio...)"
- location: "Which city or area is this property located in?" (ONLY ask ONCE - never ask about address, map, or coordinates separately)
- price: "What's the asking price?"
- price_type: "Is this price monthly, weekly, daily, or yearly?"
- bedrooms: "How many bedrooms?"
- bathrooms: "How many bathrooms?"

OPTIONAL FIELDS (NEVER ask about these - only extract if agent mentions them):
- address, area_sqm, lot_area_sqm, parking_slots, amenities, furnishing_status
- hoa_fee, property_age, floor_level, title_type, status

CRITICAL LOCATION RULE:
- Ask about location ONLY ONCE using: "Which city or area is this property located in?"
- Once location is provided (city/area name), NEVER ask about it again
- NEVER ask follow-up questions like "What's the full address?" or "Can you pin it on the map?" - the location field is complete with just the city/area

CRITICAL:
- NEVER ask about optional fields like property_age, area_sqm, parking, amenities, etc.
- ONLY ask about the 7 required fields listed above
- If agent voluntarily provides optional info, acknowledge it briefly but don't ask follow-up questions about optional details
- Be concise and move the conversation forward
- NEVER just say "I've noted your information" - always provide helpful guidance
PROMPT;

            $messages = [
                ['role' => 'system', 'content' => $systemPrompt],
            ];

            // Add recent conversation for context
            $recentHistory = array_slice($conversationHistory, -4);
            foreach ($recentHistory as $msg) {
                $messages[] = [
                    'role' => $msg['role'] ?? 'user',
                    'content' => $msg['content'] ?? '',
                ];
            }

            $messages[] = [
                'role' => 'user',
                'content' => $message,
            ];

            $response = $this->chat($messages, 0.7, 300);

            return $response['choices'][0]['message']['content'];

        } catch (Exception $e) {
            Log::error('ListingAssistant generateResponse failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'message' => $message,
                'missing_fields' => $missingFields,
            ]);
            
            // Provide a more helpful fallback that uses the actual missing fields
            if (empty($missingFields)) {
                return "Your listing looks complete! Click 'Generate AI Description' to create a professional description, then submit your listing.";
            }
            
            $firstMissing = $missingFields[0] ?? 'more details';
            $fieldPrompts = [
                'property_name' => "What would you like to name this listing?",
                'property_type' => "What type of property is this? (house, condo, apartment, etc.)",
                'location' => "Which city or area is this property located in?",
                'price' => "What's the asking price for this property?",
                'bedrooms' => "How many bedrooms does it have?",
                'bathrooms' => "How many bathrooms?",
            ];
            
            return "Got it! " . ($fieldPrompts[$firstMissing] ?? "Could you tell me about {$firstMissing}?");
        }
    }

    /**
     * Generate a professional property description
     */
    public function generatePropertyDescription(array $propertyData, string $template = 'narrative', string $agentContext = ''): string
    {
        try {
            $dataJson = json_encode($propertyData, JSON_PRETTY_PRINT);
            
            $templatePrompt = $this->getTemplatePrompt($template);
            
            $agentContextSection = '';
            if (!empty(trim($agentContext))) {
                $agentContextSection = "\n\nAGENT NOTES (incorporate these ideas into the description):\n" . trim($agentContext) . "\n";
            }

            $systemPrompt = <<<PROMPT
You are an expert real estate copywriter in the Philippines.
Generate a professional, engaging property description based on the provided data.

PROPERTY DATA:
{$dataJson}
{$agentContextSection}
{$templatePrompt}

IMPORTANT RULES:
- Only mention features that are actually provided in the data
- Do NOT make up amenities or features not listed
- If data is minimal, keep the description shorter and focused
- Always include the property name if provided
- Use Philippine location context when relevant (near EDSA, MRT accessible, etc.)
- Keep total length under 200 words
- Do NOT use markdown formatting (no **, no ##, no bullet symbols like •)
- Write in plain text only - no special formatting characters
- For bulleted template, use simple dashes (-) instead of bullet symbols
PROMPT;

            $response = $this->chat([
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => 'Generate a property description based on the provided data.'],
            ], 0.8, 500);

            return $response['choices'][0]['message']['content'];

        } catch (Exception $e) {
            Log::error('ListingAssistant generatePropertyDescription failed: ' . $e->getMessage());
            return $this->getFallbackDescription($propertyData, $agentContext);
        }
    }

    /**
     * Generate a basic fallback description when AI fails.
     * If agent notes are provided, lightly incorporate them.
     */
    protected function getFallbackDescription(array $data, string $agentContext = ''): string
    {
        $type = $data['property_type'] ?? 'property';
        $location = $data['location'] ?? '';
        $bedrooms = $data['bedrooms'] ?? '';
        $bathrooms = $data['bathrooms'] ?? '';
        $price = isset($data['price']) ? '₱' . number_format($data['price']) : '';
        $area = isset($data['area_sqm']) ? $data['area_sqm'] . ' sqm' : '';
        $name = $data['property_name'] ?? '';

        $description = '';

        if ($name) {
            $description .= "{$name} - ";
        }

        $description .= "A beautiful {$type}";
        
        if ($location) {
            $description .= " located in {$location}";
        }

        if ($bedrooms && $bathrooms) {
            $description .= " featuring {$bedrooms} bedroom(s) and {$bathrooms} bathroom(s)";
        }

        if ($area) {
            $description .= " with {$area} of living space";
        }

        $description .= ". ";

        if ($price) {
            $description .= "Offered at {$price}. ";
        }

        // Lightly incorporate agent notes (e.g., "pet friendly") if provided
        $agentNotes = trim($agentContext);
        if ($agentNotes !== '') {
            $description .= " This property is " . $agentNotes . ". ";
        }

        $description .= "Contact us today to schedule a viewing!";

        return $description;
    }

    /**
     * Get template-specific prompt for description generation
     */
    protected function getTemplatePrompt(string $template): string
    {
        $templates = [
            'narrative' => "TEMPLATE STYLE: Narrative/Paragraph Format
Write 2-3 flowing paragraphs that tell a story about the property.

Structure:
- Opening: \"Discover...\" or \"Welcome to...\" with property type and location
- Middle: Describe key features, layout, and highlights naturally
- End: Location benefits and call to action

Tone: Professional, warm, inviting
Format: Clean paragraphs only, no bullet points
Length: 120-180 words",

            'bulleted' => "TEMPLATE STYLE: Feature-Focused Bulleted Format
Create an organized feature list with clear sections.

Structure:
Property Highlights:
- [Size/bedrooms/bathrooms]
- [Key features 1-3]

Interior Features:
- [Kitchen, living, bedroom details]

Location & Extras:
- [Nearby amenities, parking, outdoor spaces]

End with: Brief call to action sentence

Tone: Clear, informative, scannable
Format: Use simple dashes (-) for lists, plain text headers (no ** or other formatting)
Length: 100-150 words total",

            'short' => "TEMPLATE STYLE: Short & Punchy
Create a brief, attention-grabbing description in 2-3 sentences.

Structure: 
[Exciting opener]. [Bedrooms/baths + top 3 features]. [Location benefit + call to action].

Example flow: \"Your dream home awaits! [Details]. [Location]. Contact today!\"

Tone: Energetic, concise, compelling
Format: 2-3 punchy sentences only
Length: 40-60 words maximum",

            'luxury' => "TEMPLATE STYLE: Luxury/High-End
Write sophisticated copy for premium properties.

Structure:
- Elegant opening about exclusivity/prestige
- Highlight premium finishes and materials
- Describe spa-like amenities and upscale features
- Mention privacy, exclusivity, lifestyle

Use words like: \"meticulously crafted\", \"architectural masterpiece\", \"resort-style\", \"bespoke\", \"prestigious\"

Tone: Sophisticated, exclusive, aspirational
Format: Flowing elegant paragraphs
Length: 120-160 words",

            'storytelling' => "TEMPLATE STYLE: Storytelling/Emotional
Create an immersive, lifestyle-focused narrative.

Structure:
- \"Imagine...\" opening with sensory experience
- Walk through daily life in this property
- Describe moments and memories possible here
- End with emotional connection and invitation

Use present tense and second person (\"you\").
Paint vivid pictures of mornings, evenings, family moments.

Tone: Warm, emotional, evocative
Format: Flowing narrative prose
Length: 120-160 words",
        ];

        return $templates[$template] ?? "TEMPLATE STYLE: Professional Default
Write a professional 2-3 paragraph description highlighting key features, location benefits, and value proposition. End with a call to action.
Length: 120-180 words";
    }

    /**
     * Validate extracted data for obvious errors
     */
    public function validateExtractedData(array $data): array
    {
        $warnings = [];

        // Check for unreasonable values
        if (isset($data['price'])) {
            if ($data['price'] < 1000) {
                $warnings[] = [
                    'field' => 'price',
                    'message' => 'The price seems very low. Did you mean ₱' . number_format($data['price'] * 1000000) . '?',
                    'value' => $data['price'],
                ];
            }
            if ($data['price'] > 10000000000) { // 10 billion
                $warnings[] = [
                    'field' => 'price',
                    'message' => 'The price seems unusually high. Please confirm this is correct.',
                    'value' => $data['price'],
                ];
            }
        }

        if (isset($data['bedrooms']) && $data['bedrooms'] > 20) {
            $warnings[] = [
                'field' => 'bedrooms',
                'message' => $data['bedrooms'] . ' bedrooms seems unusual. Please confirm.',
                'value' => $data['bedrooms'],
            ];
        }

        if (isset($data['bathrooms']) && $data['bathrooms'] > 15) {
            $warnings[] = [
                'field' => 'bathrooms',
                'message' => $data['bathrooms'] . ' bathrooms seems unusual. Please confirm.',
                'value' => $data['bathrooms'],
            ];
        }

        if (isset($data['area_sqm'])) {
            if ($data['area_sqm'] < 10) {
                $warnings[] = [
                    'field' => 'area_sqm',
                    'message' => 'The floor area seems very small. Please confirm.',
                    'value' => $data['area_sqm'],
                ];
            }
            if ($data['area_sqm'] > 10000) {
                $warnings[] = [
                    'field' => 'area_sqm',
                    'message' => 'The floor area (' . number_format($data['area_sqm']) . ' sqm) is quite large. Is this correct?',
                    'value' => $data['area_sqm'],
                ];
            }
        }

        if (isset($data['floor_level']) && $data['floor_level'] > 100) {
            $warnings[] = [
                'field' => 'floor_level',
                'message' => 'Floor ' . $data['floor_level'] . ' is very high. Please confirm.',
                'value' => $data['floor_level'],
            ];
        }

        return $warnings;
    }

    /**
     * Get or create a conversation
     */
    public function getOrCreateConversation(?string $conversationId, ?int $userId = null): ListingAssistantConversation
    {
        if ($conversationId) {
            $conversation = ListingAssistantConversation::where('conversation_id', $conversationId)->first();
            if ($conversation) {
                return $conversation;
            }
        }

        // Create new conversation
        return ListingAssistantConversation::create([
            'conversation_id' => ListingAssistantConversation::generateConversationId(),
            'user_id' => $userId,
            'extracted_data' => [],
            'skipped_fields' => [],
            'messages' => [],
            'status' => ListingAssistantConversation::STATUS_IN_PROGRESS,
        ]);
    }

    /**
     * Process a message in conversation context
     */
    public function processMessage(
        string $message,
        ?string $conversationId = null,
        ?int $userId = null
    ): array {
        // Get or create conversation
        $conversation = $this->getOrCreateConversation($conversationId, $userId);

        // Snapshot current data and history before this message
        $currentData = $conversation->extracted_data ?? [];
        $skippedFields = $conversation->skipped_fields ?? [];
        $conversationHistory = $conversation->messages ?? [];

        // --- Heuristics: handle simple replies to specific questions without relying solely on AI JSON ---
        // We snapshot which required fields are missing BEFORE this message so we can safely set them.
        $missingBefore = $this->identifyMissingFields($currentData, $skippedFields);
        $nameMissing = in_array('property_name', $missingBefore, true);
        $priceMissing = in_array('price', $missingBefore, true);
        $lastAssistantMsg = '';
        foreach (array_reverse($conversationHistory) as $msg) {
            if (($msg['role'] ?? '') === 'assistant') {
                $lastAssistantMsg = $msg['content'] ?? '';
                break;
            }
        }

        // If property_name is missing, the last assistant message asked for the name,
        // and the agent replies with non-empty text, set property_name directly.
        if ($nameMissing && stripos($lastAssistantMsg, 'name') !== false) {
            $trimmed = trim($message);
            if ($trimmed !== '') {
                $currentData['property_name'] = $trimmed;
                $conversation->extracted_data = $currentData;
                $conversation->save();
            }
        }

        // If price is currently missing, the last assistant message asked about price,
        // and the agent replies with a plain number, set price directly before calling the AI.
        if ($priceMissing && stripos($lastAssistantMsg, 'price') !== false) {
            // Try to parse common price formats: "15000", "1,500,000", "15k", "7.5M", etc.
            $trimmedPrice = trim($message);
            if ($trimmedPrice !== '') {
                if (preg_match('/([\d,.]+)\s*([kKmM]?)/', $trimmedPrice, $matches)) {
                    $numberPart = $matches[1] ?? '';
                    $suffix = $matches[2] ?? '';
                    $normalizedNumber = str_replace(',', '', $numberPart);
                    if ($normalizedNumber !== '' && is_numeric($normalizedNumber)) {
                        $priceValue = (float) $normalizedNumber;
                        // Handle shorthand: k = thousand, M = million
                        if ($suffix === 'k' || $suffix === 'K') {
                            $priceValue *= 1000;
                        } elseif ($suffix === 'm' || $suffix === 'M') {
                            $priceValue *= 1000000;
                        }
                        if ($priceValue > 0) {
                            $currentData['price'] = $priceValue;
                            $conversation->extracted_data = $currentData;
                            $conversation->save();
                        }
                    }
                }
            }
        }

        // Add user message to history
        $conversation->addMessage('user', $message);

        // Parse the message using updated data and history
        $result = $this->parseAgentMessage(
            $message,
            $conversation->messages ?? [],
            $conversation->extracted_data ?? [],
            $conversation->skipped_fields ?? []
        );

        // Update conversation with new data
        $conversation->extracted_data = $result['extracted_data'];
        $conversation->skipped_fields = $result['skipped_fields'];
        
        // Add AI response to history
        $conversation->addMessage('assistant', $result['ai_response']);

        // Validate data for warnings
        $warnings = $this->validateExtractedData($result['extracted_data']);

        // Check if form is ready
        $isFormReady = empty($result['missing_fields']);

        // Check if we can generate description
        $canGenerateDescription = $this->canGenerateDescription($result['extracted_data']);

        // Determine if description should be auto-generated
        $description = null;
        if ($isFormReady && $canGenerateDescription && 
            !isset($result['extracted_data']['description'])) {
            // Check if agent asked for description
            if (stripos($message, 'generate description') !== false ||
                stripos($message, 'write description') !== false ||
                stripos($message, 'create description') !== false) {
                $description = $this->generatePropertyDescription($result['extracted_data']);
                $result['extracted_data']['description'] = $description;
                $conversation->extracted_data = $result['extracted_data'];
                $conversation->save();
            }
        }

        // Update current step based on missing fields
        $nextStep = $this->getNextStep($result['extracted_data'], $result['skipped_fields'], $conversation->current_step);
        $conversation->current_step = $nextStep;
        $conversation->save();

        return [
            'conversation_id' => $conversation->conversation_id,
            'extracted_data' => $result['extracted_data'],
            'missing_fields' => $result['missing_fields'],
            'skipped_fields' => $result['skipped_fields'],
            'ai_response' => $result['ai_response'],
            'form_ready' => $isFormReady,
            'can_generate_description' => $canGenerateDescription,
            'description' => $description,
            'warnings' => $warnings,
            'messages' => $conversation->messages,
            'current_step' => $nextStep,
        ];
    }

    /**
     * Check if we have minimum data for description generation
     */
    protected function canGenerateDescription(array $data): bool
    {
        $minimumFields = ['property_type', 'location', 'bedrooms', 'price', 'price_type'];

        foreach ($minimumFields as $field) {
            if (!isset($data[$field]) || $data[$field] === null || $data[$field] === '') {
                return false;
            }
        }

        return true;
    }

    /**
     * Generate description on demand
     */
    public function generateDescription(string $conversationId, string $template = 'narrative', string $agentContext = ''): array
    {
        $conversation = ListingAssistantConversation::where('conversation_id', $conversationId)->first();

        if (!$conversation) {
            return [
                'success' => false,
                'error' => 'Conversation not found',
            ];
        }

        $data = $conversation->extracted_data ?? [];

        if (!$this->canGenerateDescription($data)) {
            return [
                'success' => false,
                'error' => 'Insufficient data for description generation. Need: property_type, location, price, price_type, bedrooms, bathrooms',
            ];
        }

        $description = $this->generatePropertyDescription($data, $template, $agentContext);

        // Save description, template, and AI-generated description separately
        $data['description'] = $description;
        $data['description_template'] = $template;
        $data['ai_generated_description'] = $description;
        $conversation->extracted_data = $data;
        $conversation->save();

        return [
            'success' => true,
            'description' => $description,
            'extracted_data' => $data,
            'template' => $template,
            'ai_generated_description' => $description,
        ];
    }

    /**
     * Get the next step in the flow based on current data
     */
    public function getNextStep(array $extractedData, array $skippedFields, ?string $currentStep = null): string
    {
        $requiredFields = ListingAssistantConversation::REQUIRED_FIELDS;
        $stepOrder = [
            'property_name',
            'property_type',
            'location',
            'price',
            'price_type',
            'bedrooms',
            'bathrooms',
        ];

        // If we have a current step, check if it's complete
        if ($currentStep && in_array($currentStep, $stepOrder)) {
            $currentIndex = array_search($currentStep, $stepOrder);
            $currentValue = $extractedData[$currentStep] ?? null;
            
            // If current step is not filled and not skipped, stay on it
            if (($currentValue === null || $currentValue === '') && !in_array($currentStep, $skippedFields)) {
                return $currentStep;
            }
        }

        // Find the first required field that's not filled and not skipped
        foreach ($stepOrder as $field) {
            $value = $extractedData[$field] ?? null;
            if (($value === null || $value === '') && !in_array($field, $skippedFields)) {
                return $field;
            }
        }

        // All required fields are filled, move to optional fields
        return 'optional_fields';
    }

    /**
     * Get button options for a specific field
     */
    public function getFieldButtonOptions(string $field): array
    {
        switch ($field) {
            case 'property_type':
                return array_map(function($type) {
                    return [
                        'value' => $type,
                        'label' => ucfirst($type),
                    ];
                }, ListingAssistantConversation::PROPERTY_TYPES);
            
            case 'bedrooms':
                return [
                    ['value' => '0', 'label' => 'Studio'],
                    ['value' => '1', 'label' => '1'],
                    ['value' => '2', 'label' => '2'],
                    ['value' => '3', 'label' => '3'],
                    ['value' => '4', 'label' => '4'],
                    ['value' => '5', 'label' => '5+'],
                ];
            
            case 'bathrooms':
                return [
                    ['value' => '1', 'label' => '1'],
                    ['value' => '2', 'label' => '2'],
                    ['value' => '3', 'label' => '3'],
                    ['value' => '4', 'label' => '4+'],
                ];
            
            case 'price_type':
                return [
                    ['value' => 'Fixed', 'label' => 'Fixed'],
                    ['value' => 'Negotiable', 'label' => 'Negotiable'],
                ];
            
            default:
                return [];
        }
    }

    /**
     * Generate step-specific AI response with button options
     */
    public function generateStepResponse(string $step, array $extractedData, array $skippedFields): string
    {
        $fieldLabels = [
            'property_name' => 'Property Name',
            'property_type' => 'Property Type',
            'location' => 'Location',
            'price' => 'Price',
            'bedrooms' => 'Bedrooms',
            'bathrooms' => 'Bathrooms',
        ];

        $fieldLabel = $fieldLabels[$step] ?? $step;

        switch ($step) {
            case 'property_name':
                return "Let's start! What would you like to name this property listing?";
            
            case 'property_type':
                return "What type of property is this?";
            
            case 'location':
                return "Which city or area is this property located in?";
            
            case 'price':
                return "What's the asking price?";
            
            case 'bedrooms':
                return "How many bedrooms does it have?";
            
            case 'bathrooms':
                return "How many bathrooms?";
            
            case 'optional_fields':
                return "Great! All required fields are complete. Would you like to add more details to attract more buyers?";
            
            default:
                return "Please provide the {$fieldLabel}.";
        }
    }

    /**
     * Start a new listing conversation
     */
    public function startNewConversation(?int $userId = null): array
    {
        $conversation = ListingAssistantConversation::create([
            'conversation_id' => ListingAssistantConversation::generateConversationId(),
            'user_id' => $userId,
            'extracted_data' => [],
            'skipped_fields' => [],
            'messages' => [],
            'status' => ListingAssistantConversation::STATUS_IN_PROGRESS,
            'current_step' => 'property_name',
        ]);

        $welcomeMessage = "Hello! I'm your listing assistant. I'll guide you step-by-step to create your property listing.\n\nLet's start! What would you like to name this property listing?";

        $conversation->addMessage('assistant', $welcomeMessage);

        return [
            'conversation_id' => $conversation->conversation_id,
            'ai_response' => $welcomeMessage,
            'extracted_data' => [],
            'missing_fields' => ListingAssistantConversation::REQUIRED_FIELDS,
            'skipped_fields' => [],
            'form_ready' => false,
            'can_generate_description' => false,
            'messages' => $conversation->messages,
            'current_step' => 'property_name',
        ];
    }

    /**
     * Reset a conversation to start fresh
     */
    public function resetConversation(string $conversationId): array
    {
        $conversation = ListingAssistantConversation::where('conversation_id', $conversationId)->first();

        if (!$conversation) {
            return $this->startNewConversation();
        }

        // Reset all data
        $conversation->extracted_data = [];
        $conversation->skipped_fields = [];
        $conversation->messages = [];
        $conversation->status = ListingAssistantConversation::STATUS_IN_PROGRESS;
        $conversation->current_step = 'property_name';
        $conversation->save();

        $resetMessage = "I've cleared all the previous information. Let's start fresh! Tell me about the property you want to list.";

        $conversation->addMessage('assistant', $resetMessage);

        return [
            'conversation_id' => $conversation->conversation_id,
            'ai_response' => $resetMessage,
            'extracted_data' => [],
            'missing_fields' => ListingAssistantConversation::REQUIRED_FIELDS,
            'skipped_fields' => [],
            'form_ready' => false,
            'can_generate_description' => false,
            'messages' => $conversation->messages,
        ];
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
