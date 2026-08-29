<?php

namespace App\Http\Controllers;

use App\Models\Work;
use Illuminate\Http\Request;

class WorkController extends Controller
{
    // Função para o GET (listar)
    public function index()
    {
        // Retorna todas as obras cadastradas, das mais novas para as mais velhas
        return response()->json(Work::latest()->get());
    }

    // Função para o POST (salvar)
    public function store(Request $request)
    {
        // Criamos uma nova obra no banco de dados
        $work = new Work();
        $work->title = $request->title;
        $work->cover_url = $request->cover_image; // Nome que enviamos do React
        $work->synopsis = $request->description;  // Nome que enviamos do React
        $work->type = 'novel'; // Valor padrão
        $work->status = 'ongoing'; // Valor padrão
        $work->save();

        // Retorna a obra criada avisando que deu tudo certo
        return response()->json($work, 201);
    }
}