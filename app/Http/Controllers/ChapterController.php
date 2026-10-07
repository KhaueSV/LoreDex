<?php

namespace App\Http\Controllers;

use App\Models\Work;
use Illuminate\Support\Facades\Http;
use DOMDocument;
use DOMXPath;

class ChapterController extends Controller{
    public function index(Work $work){
        try {
            $url = $work->source_url;

            if (!$url) {
                return response()->json([
                    'message' => 'Nenhuma URL de capítulos cadastrada para esta obra.'
                ], 400); 
            }

            $response = Http::timeout(15)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0',
                ])
                ->get($url);

            if (!$response->successful()) {
                return response()->json([
                    'message' => 'Não foi possível acessar a fonte dos capítulos.'
                ], 404);
            }

            $chapters = $this->extractChapters($response->body());

            return response()->json([
                'work' => [
                    'id' => $work->id,
                    'title' => $work->title,
                ],
                'chapters' => $chapters,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erro ao buscar capítulos.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function createSlug($title)
    {
        $slug = strtolower($title);

        $slug = iconv(
            'UTF-8',
            'ASCII//TRANSLIT//IGNORE',
            $slug
        );

        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);

        return trim($slug, '-');
    }

    private function extractChapters($html)
    {
        $dom = new DOMDocument();

        libxml_use_internal_errors(true);

        $dom->loadHTML($html);

        libxml_clear_errors();

        $xpath = new DOMXPath($dom);

        $chapters = [];

        $links = $xpath->query(
            "//a[contains(@href, '/chapter-')]"
        );

        foreach ($links as $link) {
            $title = trim($link->textContent);

            $href = $link->getAttribute('href');

            if (!$title) {
                continue;
            }

            preg_match(
                '/chapter[\s-]*(\d+)/i',
                $title . ' ' . $href,
                $match
            );

            if (!isset($match[1])) {
                continue;
            }

            $chapters[] = [
                'number' => (int) $match[1],

                'title' => preg_replace(
                    '/^chapter[\s-]*\d+[:\s-]*/i',
                    '',
                    $title
                ),

                'url' => str_starts_with($href, 'http')
                    ? $href
                    : 'https://novelfull.com' . $href,
            ];
        }

        return $chapters;
    }
}