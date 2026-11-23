<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\WorkController;
use Illuminate\Support\Facades\Route;

// Rotas públicas
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rotas que exigem login (cliente e admin)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // GET, POST, PUT/PATCH e DELETE de obras
    Route::apiResource('works', WorkController::class);

    Route::get('/collections', [CollectionController::class, 'index']);
    Route::post('/collections', [CollectionController::class, 'store']);
    Route::patch('/collections/{collection}', [CollectionController::class, 'update']);
    Route::delete('/collections/{collection}', [CollectionController::class, 'destroy']);
    Route::post('/collections/{collection}/works', [CollectionController::class, 'addWork']);
    Route::delete('/collections/{collection}/works/{work}', [CollectionController::class, 'removeWork']);
});
