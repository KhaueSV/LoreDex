<?php

namespace App\Http\Controllers;

use App\Models\Collection;
use App\Models\Work;
use Illuminate\Http\Request;

class CollectionController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            $request->user()->collections()
                ->with('works')
                ->orderByDesc('is_pinned')
                ->latest()
                ->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:1000',
        ]);

        $collection = $request->user()->collections()->create($data);

        return response()->json($collection->load('works'), 201);
    }

    public function update(Request $request, int $collection)
    {
        $userCollection = $this->findUserCollection($request, $collection);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'description' => 'sometimes|nullable|string|max:1000',
            'tags' => 'sometimes|array|max:10',
            'tags.*' => 'required|string|max:30',
            'is_pinned' => 'sometimes|boolean',
        ]);

        if (array_key_exists('tags', $data)) {
            $data['tags'] = array_values(array_unique(array_filter(
                array_map(fn (string $tag) => trim($tag), $data['tags']),
                fn (string $tag) => $tag !== ''
            )));
        }

        $userCollection->update($data);

        return response()->json($userCollection->load('works'));
    }

    public function destroy(Request $request, int $collection)
    {
        $this->findUserCollection($request, $collection)->delete();

        return response()->json(null, 204);
    }

    public function addWork(Request $request, int $collection)
    {
        $userCollection = $this->findUserCollection($request, $collection);
        $data = $request->validate([
            'work_id' => 'required|integer|exists:works,id',
        ]);

        $userCollection->works()->syncWithoutDetaching([$data['work_id']]);

        return response()->json($userCollection->load('works'));
    }

    public function removeWork(Request $request, int $collection, int $work)
    {
        $userCollection = $this->findUserCollection($request, $collection);
        abort_unless(Work::whereKey($work)->exists(), 404);

        $userCollection->works()->detach($work);

        return response()->json($userCollection->load('works'));
    }

    private function findUserCollection(Request $request, int $collection): Collection
    {
        return $request->user()->collections()->findOrFail($collection);
    }
}
