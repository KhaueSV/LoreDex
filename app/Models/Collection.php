<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Collection extends Model
{
    protected $fillable = ['user_id', 'name', 'description', 'tags', 'is_pinned'];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'is_pinned' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function works(): BelongsToMany
    {
        return $this->belongsToMany(Work::class)
            ->withTimestamps()
            ->orderByPivot('created_at', 'desc')
            ->orderByPivot('id', 'desc');
    }
}
