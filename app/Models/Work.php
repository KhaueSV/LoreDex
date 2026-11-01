<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Work extends Model
{
    use HasFactory;

    // Campos que permitimos cadastrar via formulário/API
    protected $fillable = [
        'title',
        'synopsis',
        'cover_url',
        'type',
        'status',
        'is_adult',
        'genres',
        'source_url',
        'total_chapters',
        'author',
    ];

    protected $casts = [
        'genres' => 'array',
        'is_adult' => 'boolean',
        'total_chapters' => 'integer',
    ];

    // Relacionamento: Uma obra (Work) possui MUITOS capítulos (Chapters)
    public function chapters()
    {
        return $this->hasMany(Chapter::class);
    }
}
