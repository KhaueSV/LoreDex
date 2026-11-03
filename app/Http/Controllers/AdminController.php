<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Work;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function stats()
    {
        return response()->json([
            'users'         => User::count(),
            'admins'        => User::where('role', 'admin')->count(),
            'works'         => Work::count(),
            'works_by_type' => Work::select('type', DB::raw('count(*) as total'))
                                   ->groupBy('type')->pluck('total', 'type'),
        ]);
    }

    public function users()
    {
        return response()->json(
            User::select('id', 'name', 'email', 'role', 'created_at')->latest()->get()
        );
    }

    public function updateRole(Request $request, User $user)
    {
        $data = $request->validate(['role' => 'required|in:cliente,admin']);

        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'Você não pode alterar o seu próprio papel.'], 422);
        }

        $user->role = $data['role'];
        $user->save();

        return response()->json($user);
    }

    public function works()
    {
        return response()->json(
            Work::withCount('users')->latest()->get()
        );
    }

    public function toggleBlockWork(Work $work)
    {
        $work->is_blocked = !$work->is_blocked;
        $work->save();

        return response()->json([
            'message' => $work->is_blocked ? 'Obra bloqueada com sucesso.' : 'Obra desbloqueada com sucesso.',
            'work' => $work
        ]);
    }

    public function destroyWork(Work $work)
    {
        $work->delete();

        return response()->json(['message' => 'Obra excluída permanentemente do catálogo.'], 200);
    }
}