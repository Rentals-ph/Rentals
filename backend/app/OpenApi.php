<?php

namespace App;

use OpenApi\Attributes as OA;

#[OA\OpenApi(
    openapi: OA\OpenApi::VERSION_3_0_0,
    info: new OA\Info(
        version: '1.0.0',
        description: 'API documentation for Rentals.ph backend',
        title: 'Rentals.ph API'
    ),
    servers: [
        new OA\Server(
            url: '/api',
            description: 'API Server (relative - works for local and remote)'
        ),
    ],
    components: new OA\Components(
        securitySchemes: [
            'sanctum' => new OA\SecurityScheme(
                securityScheme: 'sanctum',
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter token in format (Bearer <token>)'
            )
        ]
    ),
    security: [
        ['sanctum' => []]
    ],
    tags: [
        new OA\Tag(name: 'Authentication', description: 'Authentication endpoints'),
        new OA\Tag(name: 'Properties', description: 'Property management endpoints'),
        new OA\Tag(name: 'Groq AI', description: 'Groq AI chat and prompt endpoints'),
        new OA\Tag(name: 'Agents', description: 'Agent management endpoints'),
        new OA\Tag(name: 'Admin', description: 'Admin management endpoints'),
        new OA\Tag(name: 'Broker', description: 'Broker management endpoints'),
        new OA\Tag(name: 'Blogs', description: 'Blog endpoints'),
        new OA\Tag(name: 'News', description: 'News endpoints'),
        new OA\Tag(name: 'Testimonials', description: 'Testimonial endpoints'),
    ]
)]
class OpenApi
{
}

