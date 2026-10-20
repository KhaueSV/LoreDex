<?php

namespace App\Http\Controllers;

use App\Models\WorkReview;
use Illuminate\Http\Request;

class WorkReviewController extends Controller
{
    // 1. Listar todos os comentários gerais de uma obra
    public function index($workId)
    {
        $reviews = WorkReview::with('user:id,name') 
            ->where('work_id', $workId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reviews);
    }

    public function store(Request $request, $workId)
    {
        $validated = $request->validate([
            'comment'  => 'required|string|max:2000',
            'verdict'  => 'nullable|string|in:lixo,ruim,bom,foda',
            'score'    => 'nullable|numeric|min:0|max:10',
            'criteria' => 'nullable|array',
        ]);

        $review = WorkReview::create([
            'work_id'  => $workId,
            'user_id'  => $request->user()->id, 
            'comment'  => $validated['comment'],
            'verdict'  => $validated['verdict'] ?? null,
            'score'    => $validated['score'] ?? null,
            'criteria' => $validated['criteria'] ?? null,
        ]);

        // Carrega os dados do usuário para devolver pronto para a tela
        $review->load('user:id,name');

        return response()->json($review, 201);
    }

     // Editar comentário (autor ou administrador)
    public function update(Request $request, $workId, $reviewId)
    {
        $validated = $request->validate([
            'comment' => 'required|string|max:2000',
        ]);

        $review = WorkReview::where('work_id', $workId)
            ->findOrFail($reviewId);

        $user = $request->user();

        if (
            (int) $review->user_id !== (int) $user->id
            && $user->role !== 'admin'
        ) {
            return response()->json([
                'message' => 'Sem permissão para editar este comentário.',
            ], 403);
        }

        $review->update([
            'comment' => $validated['comment'],
        ]);

        $review->load('user:id,name');

        return response()->json($review);
    }

    // 3. Excluir um comentário (Apenas o autor do comentário ou Admin)
    public function destroy(Request $request, $workId, $reviewId)
    {
        $review = WorkReview::where('work_id', $workId)->findOrFail($reviewId);

        $user = $request->user();
        if ($review->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Sem permissão para excluir este comentário.'], 403);
        }

        $review->delete();

        return response()->json(['message' => 'Comentário removido com sucesso.']);
    }
}