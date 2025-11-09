<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PriceRate;
use Illuminate\Http\JsonResponse;

class RateController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => PriceRate::query()
                ->latest('effective_at')
                ->limit(50)
                ->get(),
        ]);
    }
}
