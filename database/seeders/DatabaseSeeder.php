<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@loredex.com'],
            ['name' => 'Administrador', 'password' => Hash::make('admin123'), 'role' => 'admin']
        );

        User::updateOrCreate(
            ['email' => 'cliente@loredex.com'],
            ['name' => 'Cliente Teste', 'password' => Hash::make('cliente123'), 'role' => 'cliente']
        );
    }
}