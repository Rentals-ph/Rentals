<?php

namespace App\Http\Controllers;

use App\Services\GroqService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class GroqChatController extends Controller
{
    public function __construct(protected GroqService $groqService)
    {
    }

    /**
     * General AI chat endpoint for custom prompts.
     * Allows users to send any prompt and get AI-generated responses.
     */
    #[OA\Post(
        path: "/groq/chat",
        summary: "General AI chat",
        description: "Send any prompt to the AI and receive an AI-generated response. Useful for general conversations, questions, or custom AI tasks.",
        tags: ["AI"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["prompt"],
                    properties: [
                        new OA\Property(
                            property: "prompt",
                            type: "string",
                            description: "The user's prompt or question for the AI",
                            example: "Explain the benefits of living in Quezon City"
                        ),
                        new OA\Property(
                            property: "system_prompt",
                            type: "string",
                            nullable: true,
                            description: "Optional system prompt to set the AI's behavior or context",
                            example: "You are a helpful real estate assistant in the Philippines."
                        ),
                        new OA\Property(
                            property: "temperature",
                            type: "number",
                            format: "float",
                            nullable: true,
                            description: "Controls randomness (0.0 to 2.0). Lower = more deterministic, Higher = more creative. Default: 0.7",
                            example: 0.7,
                            minimum: 0,
                            maximum: 2
                        ),
                        new OA\Property(
                            property: "max_tokens",
                            type: "integer",
                            nullable: true,
                            description: "Maximum number of tokens in the response. Default: 1000",
                            example: 1000,
                            minimum: 1,
                            maximum: 4096
                        ),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "AI-generated response",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "response", type: "string", description: "AI-generated text response"),
                        new OA\Property(property: "model", type: "string", description: "The AI model used"),
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
            new OA\Response(
                response: 500,
                description: "Server error",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string"),
                        new OA\Property(property: "error", type: "string"),
                    ]
                )
            ),
        ]
    )]
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'prompt'         => ['required', 'string', 'min:1', 'max:5000'],
            'system_prompt' => ['nullable', 'string', 'max:2000'],
            'temperature'   => ['nullable', 'numeric', 'min:0', 'max:2'],
            'max_tokens'    => ['nullable', 'integer', 'min:1', 'max:4096'],
        ]);

        try {
            $prompt = $request->input('prompt');
            $systemPrompt = $request->input('system_prompt');
            $temperature = $request->input('temperature', 0.7);
            $maxTokens = $request->input('max_tokens', 1000);

            $response = $this->groqService->chat(
                prompt: $prompt,
                systemPrompt: $systemPrompt,
                temperature: (float) $temperature,
                maxTokens: (int) $maxTokens
            );

            return response()->json([
                'response' => $response,
                'model'   => env('GROQ_MODEL', 'llama-3.3-70b-versatile'),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to process chat request',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}

