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
        'is_blocked' => 'boolean',
        'total_chapters' => 'integer',
    ];

    // Usuários que têm esta obra na biblioteca pessoal
    public function users()
    {
        return $this->belongsToMany(User::class, 'user_works')->withTimestamps();
    }

    // Relacionamento: Uma obra (Work) possui MUITOS capítulos (Chapters)
    public function chapters()
    {
        return $this->hasMany(Chapter::class);
    }
}
