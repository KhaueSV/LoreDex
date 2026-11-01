<?php

namespace App\Http\Controllers;

use App\Models\Work;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class WorkController extends Controller
{
    // GET: listar
    public function index()
    {
        return response()->json(Work::latest()->get());
    }

    // GET: exibir detalhes de uma obra
    public function show($id)
    {
        return response()->json(Work::findOrFail($id));
    }

    // POST: salvar
    public function store(Request $request)
    {
        $titleTrimmed = trim((string) $request->title);

        if ($titleTrimmed === '') {
            return response()->json(['message' => 'O título da obra é obrigatório.'], 422);
        }

        $existing = Work::whereRaw('LOWER(TRIM(title)) = ?', [mb_strtolower($titleTrimmed, 'UTF-8')])->first();
        if ($existing) {
            return response()->json([
                'message' => 'Esta obra já está na sua biblioteca.',
                'work'    => $existing,
            ], 409);
        }

        $work = new Work();
        $work->title = $titleTrimmed;
        $work->cover_url = $request->cover_image ?? $request->cover_url;

        $rawDesc = $request->description ?? $request->synopsis ?? '';
        $work->synopsis = $this->translateTextIfNeeded($rawDesc);

        $work->source_url = $request->source_url;
        $work->type = $this->normalizeType($request->type);
        $work->status = $this->normalizeStatus($request->status);
        $work->is_adult = filter_var($request->is_adult ?? false, FILTER_VALIDATE_BOOLEAN);
        $work->genres = $this->normalizeGenres($request->genres);

        $chapters = (int) ($request->total_chapters ?? 0);
        if ($chapters <= 0 && !empty($work->title)) {
            $chapters = $this->fetchChaptersFallback($work->title, $work->source_url);
        }
        $work->total_chapters = $chapters;

        $work->save();

        return response()->json($work, 201);
    }

    // PUT/PATCH: editar
    public function update(Request $request, $id)
    {
        $work = Work::findOrFail($id);

        if ($request->has('title')) {
            $work->title = $request->title;
        }
        if ($request->has('cover_image') || $request->has('cover_url')) {
            $work->cover_url = $request->cover_image ?? $request->cover_url;
        }
        if ($request->has('description') || $request->has('synopsis')) {
            $desc = $request->description ?? $request->synopsis;
            $work->synopsis = $request->boolean('auto_translate')
                ? $this->translateTextIfNeeded($desc)
                : $desc;
        }
        if ($request->has('source_url')) {
            $work->source_url = $request->source_url;
        }
        if ($request->has('type')) {
            $work->type = $this->normalizeType($request->type);
        }
        if ($request->has('status')) {
            $work->status = $this->normalizeStatus($request->status);
        }
        if ($request->has('is_adult')) {
            $work->is_adult = filter_var($request->is_adult, FILTER_VALIDATE_BOOLEAN);
        }
        if ($request->has('genres')) {
            $work->genres = $this->normalizeGenres($request->genres);
        }
        if ($request->has('total_chapters')) {
            $work->total_chapters = max(0, (int) $request->total_chapters);
        }

        $work->save();

        return response()->json($work);
    }

    // DELETE: excluir
    public function destroy($id)
    {
        Work::findOrFail($id)->delete();

        return response()->json(null, 204);
    }

    /**
     * Sincroniza dados faltantes (gêneros, capítulos, tradução de sinopse, formato e status)
     * para uma obra específica ou todas as obras da biblioteca.
     */
    public function syncMetadata(Request $request, $id = null)
    {
        $works = $id ? [Work::findOrFail($id)] : Work::all();
        $updated = [];

        foreach ($works as $work) {
            $aniData = $this->fetchAniListMetadata($work->title);

            if ($aniData) {
                if (empty($work->genres)) {
                    $work->genres = $aniData['genres'] ?? [];
                }
                if (!empty($aniData['format'])) {
                    $work->type = $this->normalizeType($aniData['format']);
                }
                if (!empty($aniData['status'])) {
                    $work->status = $this->normalizeStatus($aniData['status']);
                }
                if (isset($aniData['isAdult'])) {
                    $work->is_adult = (bool) $aniData['isAdult'];
                }
                if ((int) $work->total_chapters <= 0 && !empty($aniData['chapters'])) {
                    $work->total_chapters = (int) $aniData['chapters'];
                }
                if (empty($work->synopsis) || $work->synopsis === 'Sem sinopse disponível.') {
                    if (!empty($aniData['description'])) {
                        $clean = strip_tags($aniData['description']);
                        $work->synopsis = $this->translateTextIfNeeded($clean);
                    }
                }
            }

            if ((int) $work->total_chapters <= 0) {
                $fallbackChapters = $this->fetchChaptersFallback($work->title, $work->source_url);
                if ($fallbackChapters > 0) {
                    $work->total_chapters = $fallbackChapters;
                }
            }

            if (!empty($work->synopsis) && $work->synopsis !== 'Sem sinopse disponível.') {
                $work->synopsis = $this->translateTextIfNeeded($work->synopsis);
            }

            $work->save();
            $updated[] = $work;
        }

        return response()->json($id ? ($updated[0] ?? null) : $updated);
    }

    private function normalizeType($type): string
    {
        $upper = strtoupper(trim((string) $type));
        if (in_array($upper, ['MANGA', 'ONE_SHOT', 'MANHWA', 'MANHUA'])) {
            return 'manga';
        }
        if ($upper === 'WEBNOVEL') {
            return 'webnovel';
        }
        return 'novel';
    }

    private function normalizeStatus($status): string
    {
        $upper = strtoupper(trim((string) $status));
        if (in_array($upper, ['FINISHED', 'COMPLETED', 'CONCLUÍDO', 'CONCLUIDO'])) {
            return 'completed';
        }
        if (in_array($upper, ['CANCELLED', 'HIATUS', 'DROPPED', 'CANCELADO'])) {
            return 'dropped';
        }
        return 'ongoing';
    }

    private function normalizeGenres($genres): array
    {
        if (is_array($genres)) {
            return array_values(array_filter($genres));
        }
        if (is_string($genres) && trim($genres) !== '') {
            $decoded = json_decode($genres, true);
            if (is_array($decoded)) {
                return array_values(array_filter($decoded));
            }
            return array_values(array_filter(array_map('trim', explode(',', $genres))));
        }
        return [];
    }

    public function translateTextIfNeeded(?string $text): string
    {
        if (!$text || trim($text) === '' || trim($text) === 'Sem sinopse disponível.') {
            return $text ?: 'Sem sinopse disponível.';
        }

        $clean = trim(strip_tags($text));

        // Remove "(Source: ...)" notes common on AniList
        $clean = trim(preg_replace('/\(Source:[^)]+\)/i', '', $clean));

        try {
            $response = Http::timeout(8)->get('https://translate.googleapis.com/translate_a/single', [
                'client' => 'gtx',
                'sl'     => 'auto',
                'tl'     => 'pt',
                'dt'     => 't',
                'q'      => $clean,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                if (is_array($data) && isset($data[0]) && is_array($data[0])) {
                    $translated = '';
                    foreach ($data[0] as $segment) {
                        if (isset($segment[0])) {
                            $translated .= $segment[0];
                        }
                    }
                    if (trim($translated) !== '') {
                        return trim($translated);
                    }
                }
            }
        } catch (\Throwable $e) {
            // Se falhar a tradução online, mantém o texto original sem quebrar
        }

        return $clean;
    }

    private function fetchAniListMetadata(string $title): ?array
    {
        $query = '
            query ($search: String) {
                Media(search: $search, type: MANGA) {
                    id
                    title { romaji english }
                    description(asHtml: false)
                    format
                    status
                    isAdult
                    genres
                    chapters
                }
            }
        ';

        try {
            $response = Http::timeout(8)->post('https://graphql.anilist.co', [
                'query' => $query,
                'variables' => ['search' => $title],
            ]);

            if ($response->successful()) {
                return $response->json('data.Media');
            }
        } catch (\Throwable $e) {
            // Ignora falha de rede
        }

        return null;
    }

    private function fetchChaptersFallback(string $title, ?string $sourceUrl = null): int
    {
        // 1. Tenta via Jikan API (MyAnimeList)
        try {
            $response = Http::timeout(8)->get('https://api.jikan.moe/v4/manga', [
                'q' => $title,
                'limit' => 3,
            ]);

            if ($response->successful()) {
                $items = $response->json('data') ?? [];
                foreach ($items as $item) {
                    if (!empty($item['chapters']) && (int) $item['chapters'] > 0) {
                        return (int) $item['chapters'];
                    }
                }
            }
        } catch (\Throwable $e) {
            // Continua para próxima fonte
        }

        // 2. Tenta via MangaDex API (busca último capítulo numérico publicado)
        try {
            $searchRes = Http::timeout(8)->get('https://api.mangadex.org/manga', [
                'title' => $title,
                'limit' => 1,
                'order[relevance]' => 'desc',
            ]);

            if ($searchRes->successful()) {
                $mangaList = $searchRes->json('data') ?? [];
                if (!empty($mangaList[0]['id'])) {
                    $mangaId = $mangaList[0]['id'];
                    $lastChapterAttr = $mangaList[0]['attributes']['lastChapter'] ?? null;
                    if (is_numeric($lastChapterAttr) && (int) $lastChapterAttr > 0) {
                        return (int) $lastChapterAttr;
                    }

                    // Aggregate endpoint to get latest chapter number on MangaDex
                    $aggRes = Http::timeout(8)->get("https://api.mangadex.org/manga/{$mangaId}/aggregate");
                    if ($aggRes->successful()) {
                        $volumes = $aggRes->json('volumes') ?? [];
                        $maxChap = 0;
                        foreach ($volumes as $vol) {
                            foreach (($vol['chapters'] ?? []) as $chapKey => $chapData) {
                                if (is_numeric($chapKey)) {
                                    $num = (int) floor((float) $chapKey);
                                    if ($num > $maxChap) {
                                        $maxChap = $num;
                                    }
                                }
                            }
                        }
                        if ($maxChap > 0) {
                            return $maxChap;
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            // Ignora falha
        }

        return 0;
    }
}
