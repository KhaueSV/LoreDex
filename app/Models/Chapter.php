<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Chapter extends Model
{
    use HasFactory;

    protected $fillable = ['work_id', 'number', 'title', 'source_url'];

    // Relacionamento: Um capítulo (Chapter) PERTENCE A uma única obra (Work)
    public function work()
    {
        return $this->belongsTo(Work::class);
    }
}