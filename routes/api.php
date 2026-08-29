<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WorkController;

Route::apiResource('works', WorkController::class);