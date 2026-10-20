<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WorkController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ChapterController;
use App\Http\Controllers\WorkReviewController;

// Rotas públicas
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rotas que exigem login (cliente e admin)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/works', [WorkController::class, 'index']);
    Route::get('/works/{work}', [WorkController::class, 'show']);

    // Capítulos de uma obra (leitura)
    Route::get('/works/{work}/chapters', [ChapterController::class, 'index']);

   // Rotas de Comentários e Avaliações da Obra
    Route::get('/works/{workId}/reviews', [WorkReviewController::class, 'index']);
    Route::post('/works/{workId}/reviews', [WorkReviewController::class, 'store']);
    Route::put('/works/{workId}/reviews/{reviewId}', [WorkReviewController::class, 'update']);
    Route::delete('/works/{workId}/reviews/{reviewId}', [WorkReviewController::class, 'destroy']);

    // Só administrador
    Route::middleware('admin')->group(function () {
        Route::post('/works', [WorkController::class, 'store']);
        Route::match(['put', 'patch'], '/works/{work}', [WorkController::class, 'update']);
        Route::delete('/works/{work}', [WorkController::class, 'destroy']);

        Route::prefix('admin')->group(function () {
            Route::get('/stats', [AdminController::class, 'stats']);
            Route::get('/users', [AdminController::class, 'users']);
            Route::patch('/users/{user}/role', [AdminController::class, 'updateRole']);
        });
    });
});
