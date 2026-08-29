<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Work extends Model
{
    use HasFactory;

    // Campos que permitimos cadastrar via formulário/API
    protected $fillable = ['title', 'type', 'author', 'synopsis', 'cover_url', 'status'];

    // Relacionamento: Uma obra (Work) possui MUITOS capítulos (Chapters)
    public function chapters()
    {
        return $this->hasMany(Chapter::class);
    }
}