<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'work_id',
        'user_id',
        'comment',
        'verdict',
        'score',
        'criteria',
    ];

    protected $casts = [
        'criteria' => 'array',
        'score' => 'float',
    ];

    // Relacionamento: O comentário pertence a um usuário (autor)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relacionamento: O comentário pertence a uma obra
    public function work()
    {
        return $this->belongsTo(Work::class);
    }
}