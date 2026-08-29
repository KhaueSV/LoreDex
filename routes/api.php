<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WorkController;

// Retorna a lista de obras (GET)
Route::get('/works', [WorkController::class, 'index']);

// Recebe os dados do formulário e salva (POST)
Route::post('/works', [WorkController::class, 'store']);