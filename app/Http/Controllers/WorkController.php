<?php

namespace App\Http\Controllers;

use App\Models\Work;
use Illuminate\Http\Request;

class WorkController extends Controller
{
    // Retorna a lista de todas as obras (GET /api/works)
    public function index()
    {
        return response()->json(Work::withCount('chapters')->latest()->get());
    }

    // Salva uma nova obra no banco (POST /api/works)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:novel,manga,webnovel',
            'author' => 'nullable|string|max:255',
            'synopsis' => 'nullable|string',
            'cover_url' => 'nullable|string',
            'status' => 'required|in:ongoing,completed,dropped',
        ]);

        $work = Work::create($validated);

        return response()->json($work, 201);
    }

    // Exibe uma obra específica com seus capítulos (GET /api/works/{id})
    public function show($id)
    {
        $work = Work::with('chapters')->findOrFail($id);
        return response()->json($work);
    }
}