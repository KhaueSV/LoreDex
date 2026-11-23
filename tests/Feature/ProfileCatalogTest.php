<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Work;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ProfileCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_changes_require_password_for_credentials(): void
    {
        $user = User::factory()->create(['password' => 'senha-antiga']);
        $token = $user->createToken('test')->plainTextToken;
        $this->withToken($token);

        $profile = ['name' => 'Novo nome', 'email' => 'novo@example.com'];
        $this->patchJson('/api/profile', $profile)->assertUnprocessable();
        $this->patchJson('/api/profile', $profile + [
            'current_password' => 'senha-incorreta',
        ])->assertUnprocessable();

        $this->patchJson('/api/profile', $profile + [
            'current_password' => 'senha-antiga',
            'password' => 'senha-nova',
            'password_confirmation' => 'senha-nova',
        ])->assertOk()->assertJsonPath('email', 'novo@example.com')->assertJsonMissingPath('password');
        $this->assertTrue(Hash::check('senha-nova', $user->fresh()->password));
    }

    public function test_activity_is_private_and_updates_preserve_other_fields(): void
    {
        $first = User::factory()->create();
        $second = User::factory()->create();
        $work = Work::create(['title' => 'Favorita']);
        $first->works()->attach($work);
        $this->withToken($first->createToken('first')->plainTextToken);

        $this->patchJson("/api/profile/works/{$work->id}", ['viewed' => true])->assertNoContent();
        $this->patchJson("/api/profile/works/{$work->id}", ['is_favorite' => true])->assertNoContent();
        $this->getJson('/api/profile')->assertOk()
            ->assertJsonPath('recently_added.0.id', $work->id)
            ->assertJsonPath('recently_viewed.0.id', $work->id)
            ->assertJsonPath('favorites.0.id', $work->id);

        $this->patchJson("/api/profile/works/{$work->id}", ['is_favorite' => false])->assertNoContent();
        $this->getJson('/api/profile')->assertOk()->assertJsonCount(0, 'favorites')->assertJsonCount(1, 'recently_viewed');

        $this->app['auth']->forgetGuards();
        $this->withToken($second->createToken('second')->plainTextToken)
            ->getJson('/api/profile')->assertOk()->assertJsonCount(0, 'recently_viewed');
    }

    public function test_catalog_combines_sources_and_tolerates_an_upstream_error(): void
    {
        $user = User::factory()->create();
        $this->withToken($user->createToken('test')->plainTextToken);
        Http::preventStrayRequests();
        Http::fake([
            'openlibrary.org/*' => Http::sequence()
                ->push(['docs' => [['key' => '/works/OL1W', 'title' => 'Novel']]])
                ->pushStatus(503),
            'api.jikan.moe/*' => Http::response(['data' => [['mal_id' => 7, 'title' => 'Manhwa', 'type' => 'Manhwa']]]),
        ]);

        $this->getJson('/api/catalog/search?q=obra')->assertOk()
            ->assertJsonPath('0.format', 'NOVEL')->assertJsonPath('1.format', 'MANHWA');
        $this->getJson('/api/catalog/search?q=obra')->assertOk()
            ->assertJsonCount(1)->assertJsonPath('0.id', 'jikan:7');
        $this->assertDatabaseCount('works', 0);
    }
}
