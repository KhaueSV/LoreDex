<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WorkController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChapterController;

// Rotas públicas
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rotas que exigem login
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // GET, POST, PUT/PATCH e DELETE de obras
    Route::apiResource('works', WorkController::class);

    // Capítulos de uma obra
    Route::get('/works/{work}/chapters', [ChapterController::class, 'index']);
});