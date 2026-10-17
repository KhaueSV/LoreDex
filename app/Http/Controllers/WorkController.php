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
        $work = new Work();
        $work->title = $request->title;
        $work->cover_url = $request->cover_image;
        $work->synopsis = $request->description;
        $work->source_url = $request->source_url;
        $work->type = 'novel';
        $work->status = 'ongoing';
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
        $work->total_chapters = $request->total_chapters ?? 0;
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