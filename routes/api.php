<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WorkController;
use App\Http\Controllers\AuthController;

// Rotas públicas
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rotas que exigem login
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // GET, POST, PUT/PATCH e DELETE de obras
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);

        // Cliente e admin
        Route::get('/works', [WorkController::class, 'index']);
        Route::get('/works/{work}', [WorkController::class, 'show']);

        // Só administrador
        Route::middleware('admin')->group(function () {
        Route::post('/works', [WorkController::class, 'store']);
        Route::match(['put', 'patch'], '/works/{work}', [WorkController::class, 'update']);
        Route::delete('/works/{work}', [WorkController::class, 'destroy']);
        });
    });
});
