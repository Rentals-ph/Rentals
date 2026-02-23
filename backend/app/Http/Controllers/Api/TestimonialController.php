<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class TestimonialController extends Controller
{
    #[OA\Get(
        path: "/testimonials",
        summary: "Get list of testimonials",
        tags: ["Testimonials"],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of testimonials",
                content: new OA\JsonContent(
                    type: "array",
                    items: new OA\Items(type: "object")
                )
            ),
        ]
    )]
    public function index()
    {
        $testimonials = Testimonial::latest()->get();
        return response()->json($testimonials);
    }
}

