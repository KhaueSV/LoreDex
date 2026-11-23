<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class CatalogController extends Controller
{
    public function search(Request $request)
    {
        $data = $request->validate(['q' => 'required|string|min:2|max:120']);
        $query = $data['q'];

        $responses = Http::pool(fn (Pool $pool) => [
            $pool->as('books')->timeout(4)->get('https://openlibrary.org/search.json', [
                'title' => $query,
                'fields' => 'key,title,cover_i',
                'limit' => 4,
            ]),
            $pool->as('manga')->timeout(4)->get('https://api.jikan.moe/v4/manga', [
                'q' => $query,
                'limit' => 5,
                'sfw' => 'true',
            ]),
        ]);

        $books = $this->items($responses['books'], 'docs');
        $manga = $this->items($responses['manga'], 'data');
        if (!$books && !$manga && !$this->ok($responses['books']) && !$this->ok($responses['manga'])) {
            return response()->json(['message' => 'As fontes externas estão temporariamente indisponíveis.'], 503);
        }

        return response()->json([
            ...array_map(fn ($item) => [
                'id' => 'openlibrary:'.$item['key'],
                'title' => ['romaji' => $item['title']],
                'coverImage' => ['extraLarge' => isset($item['cover_i'])
                    ? 'https://covers.openlibrary.org/b/id/'.$item['cover_i'].'-M.jpg' : null],
                'format' => 'NOVEL',
                'sourceUrl' => 'https://openlibrary.org'.$item['key'],
            ], array_values(array_filter($books, fn ($item) => isset($item['key'], $item['title'])))),
            ...array_map(fn ($item) => [
                'id' => 'jikan:'.$item['mal_id'],
                'title' => ['romaji' => $item['title'], 'english' => $item['title_english'] ?? null],
                'coverImage' => ['extraLarge' => $item['images']['jpg']['large_image_url'] ?? null],
                'description' => $item['synopsis'] ?? null,
                'format' => str_replace(' ', '_', strtoupper($item['type'] ?? 'MANGA')),
                'status' => ($item['status'] ?? null) === 'Finished' ? 'FINISHED' : 'RELEASING',
                'genres' => array_column($item['genres'] ?? [], 'name'),
                'chapters' => $item['chapters'] ?? null,
                'sourceUrl' => $item['url'] ?? null,
            ], array_values(array_filter($manga, fn ($item) => isset($item['mal_id'], $item['title'])))),
        ]);
    }

    private function ok(mixed $response): bool
    {
        return $response instanceof Response && $response->successful();
    }

    private function items(mixed $response, string $key): array
    {
        return $this->ok($response) ? ($response->json($key) ?? []) : [];
    }
}
