<?php

use App\Http\Controllers\Api\RateController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/rates', [RateController::class, 'index']);
});

