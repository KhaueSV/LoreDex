<?php

namespace App\Http\Controllers;

use App\Models\WorkReview;
use Illuminate\Http\Request;

class WorkReviewController extends Controller
{
    // 1. Listar todos os comentários gerais de uma obra
    public function index($workId)
    {
        // Garante a inclusão explícita de user_id da review para o frontend comparar
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

        $review->load('user:id,name');

        return response()->json($review, 201);
    }

    // 2. Editar comentário: APENAS o autor original pode alterar seu próprio texto
    public function update(Request $request, $workId, $reviewId)
    {
        $validated = $request->validate([
            'comment' => 'required|string|max:2000',
        ]);

        $review = WorkReview::where('work_id', $workId)
            ->findOrFail($reviewId);

        $user = $request->user();

        // Bloqueia qualquer pessoa que não seja o autor (inclusive administradores)
        if ((int) $review->user_id !== (int) $user->id) {
            return response()->json([
                'message' => 'Apenas o autor pode editar as palavras do comentário.',
            ], 403);
        }

        $review->update([
            'comment' => $validated['comment'],
        ]);

        $review->load('user:id,name');

        return response()->json($review);
    }

    // 3. Excluir comentário: Autor original OU Administrador
    public function destroy(Request $request, $workId, $reviewId)
    {
        $review = WorkReview::where('work_id', $workId)->findOrFail($reviewId);

        $user = $request->user();

        $isOwner = (int) $review->user_id === (int) $user->id;
        $isAdmin = ($user->role === 'admin' || (bool) ($user->is_admin ?? false));

        if (!$isOwner && !$isAdmin) {
            return response()->json([
                'message' => 'Sem permissão para excluir este comentário.',
            ], 403);
        }

        $review->delete();

        return response()->json(['message' => 'Comentário removido com sucesso.']);
    }
}