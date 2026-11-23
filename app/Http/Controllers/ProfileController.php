<?php

namespace App\Http\Controllers;

use App\Models\Work;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $activity = $user->workActivity()->where('works.is_blocked', false);

        return response()->json([
            'user' => $user,
            'recently_added' => $user->works()->where('works.is_blocked', false)
                ->orderByPivotDesc('created_at')->limit(12)->get(),
            'recently_viewed' => (clone $activity)->wherePivotNotNull('last_viewed_at')
                ->orderByPivotDesc('last_viewed_at')->limit(12)->get(),
            'favorites' => $activity->wherePivot('is_favorite', true)->orderBy('title')->get(),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user)],
            'password' => ['nullable', 'string', 'min:8', 'max:72', 'confirmed'],
            'current_password' => ['required_with:password', 'nullable', 'current_password:sanctum'],
        ]);

        if ($user->email !== $data['email'] && !$request->filled('current_password')) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'current_password' => 'Informe a senha atual para alterar o e-mail.',
            ]);
        }

        $user->fill(['name' => $data['name'], 'email' => $data['email']]);
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }
        if (!empty($data['password'])) {
            $user->password = $data['password'];
        }
        $user->save();

        return response()->json($user);
    }

    public function activity(Request $request, Work $work)
    {
        abort_if($work->is_blocked, 404);
        $data = $request->validate([
            'viewed' => ['required_without:is_favorite', 'boolean'],
            'is_favorite' => ['required_without:viewed', 'boolean'],
        ]);
        $values = [];
        if (!empty($data['viewed'])) {
            $values['last_viewed_at'] = now();
        }
        if (array_key_exists('is_favorite', $data)) {
            $values['is_favorite'] = $data['is_favorite'];
        }
        if ($values) {
            DB::table('user_work_activity')->upsert(
                [['user_id' => $request->user()->id, 'work_id' => $work->id] + $values],
                ['user_id', 'work_id'],
                array_keys($values),
            );
        }

        return response()->noContent();
    }
}
