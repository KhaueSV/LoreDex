<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WorkController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CatalogController;
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
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::patch('/profile/works/{work}', [ProfileController::class, 'activity']);
    Route::get('/catalog/search', [CatalogController::class, 'search'])->middleware('throttle:30,1');

    Route::get('/collections', [CollectionController::class, 'index']);
    Route::post('/collections', [CollectionController::class, 'store']);
    Route::patch('/collections/{collection}', [CollectionController::class, 'update']);
    Route::delete('/collections/{collection}', [CollectionController::class, 'destroy']);
    Route::post('/collections/{collection}/works', [CollectionController::class, 'addWork']);
    Route::delete('/collections/{collection}/works/{work}', [CollectionController::class, 'removeWork']);

    Route::get('/works', [WorkController::class, 'index']);
    Route::get('/works/{work}', [WorkController::class, 'show']);
    Route::post('/works', [WorkController::class, 'store']);
    Route::post('/works/{work}/sync', [WorkController::class, 'syncMetadata']);
    Route::patch('/works/{work}/chapters-count', [WorkController::class, 'updateChaptersCount']);
    Route::post('/works/recommend', [WorkController::class, 'recommend']);

    // Capítulos de uma obra (leitura)
    Route::get('/works/{work}/chapters', [ChapterController::class, 'index']);

   // Rotas de Comentários e Avaliações da Obra
    Route::get('/works/{workId}/reviews', [WorkReviewController::class, 'index']);
    Route::post('/works/{workId}/reviews', [WorkReviewController::class, 'store']);
    Route::put('/works/{workId}/reviews/{reviewId}', [WorkReviewController::class, 'update']);
    Route::delete('/works/{workId}/reviews/{reviewId}', [WorkReviewController::class, 'destroy']);

    // Remover obra da biblioteca do usuário logado (disponível para todos os usuários)
    Route::delete('/works/{work}', [WorkController::class, 'destroy']);

    // Só administrador
    Route::middleware('admin')->group(function () {
        Route::post('/works/sync-all', [WorkController::class, 'syncMetadata']);
        Route::match(['put', 'patch'], '/works/{work}', [WorkController::class, 'update']);

        Route::prefix('admin')->group(function () {
            Route::get('/stats', [AdminController::class, 'stats']);
            Route::get('/users', [AdminController::class, 'users']);
            Route::patch('/users/{user}/role', [AdminController::class, 'updateRole']);
            Route::get('/works', [AdminController::class, 'works']);
            Route::patch('/works/{work}/toggle-block', [AdminController::class, 'toggleBlockWork']);
            Route::delete('/works/{work}', [AdminController::class, 'destroyWork']);
        });
    });
});
