<?php

namespace App\Http\Controllers;

use App\Models\Work;
use Illuminate\Http\Request;

class WorkController extends Controller
{
    // GET: listar
    public function index()
    {
        return response()->json(Work::latest()->get());
    }

    // POST: salvar
    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'cover_image' => 'nullable|url|max:255',
            'description' => 'nullable|string',
            'type' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:50',
        ]);

        $format = strtolower($data['type'] ?? '');
        $type = in_array($format, ['manga', 'manhwa', 'manhua', 'one_shot'], true)
            ? 'manga'
            : ($format === 'webnovel' ? 'webnovel' : 'novel');

        $status = strtolower($data['status'] ?? '');
        $status = match ($status) {
            'completed', 'finished' => 'completed',
            'dropped', 'cancelled' => 'dropped',
            default => 'ongoing',
        };

        $work = new Work();
        $work->title = $data['title'];
        $work->cover_url = $data['cover_image'] ?? null;
        $work->synopsis = $data['description'] ?? null;
        $work->type = $type;
        $work->status = $status;
        $work->save();

        return response()->json($work, 201);
    }

    // PUT: editar
    public function update(Request $request, $id)
    {
        $work = Work::findOrFail($id);

        $work->title = $request->title;
        $work->cover_url = $request->cover_image;
        $work->synopsis = $request->description;
        $work->save();

        return response()->json($work);
    }

    // DELETE: excluir
    public function destroy($id)
    {
        Work::findOrFail($id)->delete();

        return response()->json(null, 204);
    }
}