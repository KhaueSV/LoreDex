<?php

namespace Tests\Feature;

use App\Models\Collection;
use App\Models\User;
use App\Models\Work;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CollectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_work_can_be_added_to_multiple_collections_without_duplicates(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $work = Work::create(['title' => 'Obra de teste']);

        $firstCollection = $this->postJson('/api/collections', [
            'name' => 'Fantasia',
        ])->assertCreated()->json();

        $secondCollection = $this->postJson('/api/collections', [
            'name' => 'Favoritas',
        ])->assertCreated()->json();

        $this->postJson("/api/collections/{$firstCollection['id']}/works", [
            'work_id' => $work->id,
        ])->assertOk()->assertJsonPath('works.0.id', $work->id);

        $this->postJson("/api/collections/{$firstCollection['id']}/works", [
            'work_id' => $work->id,
        ])->assertOk();

        $this->postJson("/api/collections/{$secondCollection['id']}/works", [
            'work_id' => $work->id,
        ])->assertOk()->assertJsonPath('works.0.id', $work->id);

        $this->assertDatabaseCount('collection_work', 2);
        $this->getJson('/api/collections')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['title' => 'Obra de teste']);
    }

    public function test_collections_are_private_to_their_owner_and_work_ids_are_validated(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $collection = Collection::create([
            'user_id' => $owner->id,
            'name' => 'Privada',
        ]);
        $work = Work::create(['title' => 'Obra de teste']);

        Sanctum::actingAs($otherUser);

        $this->getJson('/api/collections')->assertOk()->assertJsonCount(0);
        $this->postJson("/api/collections/{$collection->id}/works", [
            'work_id' => $work->id,
        ])->assertNotFound();

        $this->postJson('/api/collections', [
            'name' => '',
        ])->assertUnprocessable();
    }

    public function test_a_manual_work_can_be_created_and_added_to_a_collection(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $collection = $this->postJson('/api/collections', [
            'name' => 'Leituras',
        ])->assertCreated()->json();

        $work = $this->postJson('/api/works', [
            'title' => 'Minha obra manual',
            'cover_image' => 'https://example.com/capa.jpg',
            'description' => 'Sinopse da obra.',
            'type' => 'manga',
            'status' => 'COMPLETED',
        ])->assertCreated()
            ->assertJsonPath('title', 'Minha obra manual')
            ->assertJsonPath('type', 'manga')
            ->assertJsonPath('status', 'completed')
            ->json();

        $this->postJson("/api/collections/{$collection['id']}/works", [
            'work_id' => $work['id'],
        ])->assertOk()
            ->assertJsonPath('works.0.title', 'Minha obra manual')
            ->assertJsonPath('works.0.cover_url', 'https://example.com/capa.jpg');
    }

    public function test_anilist_work_formats_are_normalized_to_supported_database_values(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/works', [
            'title' => 'Obra do AniList',
            'type' => 'MANGA',
            'status' => 'FINISHED',
        ])->assertCreated()
            ->assertJsonPath('type', 'manga')
            ->assertJsonPath('status', 'completed');
    }

    public function test_collection_lists_its_most_recently_added_work_first(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $collection = $this->postJson('/api/collections', [
            'name' => 'Favoritas',
        ])->assertCreated()->json();

        $firstWork = Work::create(['title' => 'Obra anterior']);
        $latestWork = Work::create(['title' => 'Obra mais recente']);

        $this->postJson("/api/collections/{$collection['id']}/works", [
            'work_id' => $firstWork->id,
        ])->assertOk();
        $this->postJson("/api/collections/{$collection['id']}/works", [
            'work_id' => $latestWork->id,
        ])->assertOk()->assertJsonPath('works.0.title', 'Obra mais recente');
    }

    public function test_collections_can_be_tagged_and_pinned_to_the_top(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $regularCollection = $this->postJson('/api/collections', [
            'name' => 'Leituras',
        ])->assertCreated()->json();
        $pinnedCollection = $this->postJson('/api/collections', [
            'name' => 'Favoritas',
        ])->assertCreated()->json();

        $this->patchJson("/api/collections/{$pinnedCollection['id']}", [
            'tags' => [' Fantasia ', 'Ler depois', 'Fantasia'],
            'is_pinned' => true,
        ])->assertOk()
            ->assertJsonPath('tags', ['Fantasia', 'Ler depois'])
            ->assertJsonPath('is_pinned', true);

        $this->getJson('/api/collections')
            ->assertOk()
            ->assertJsonPath('0.id', $pinnedCollection['id'])
            ->assertJsonPath('1.id', $regularCollection['id']);
    }

    public function test_a_user_cannot_update_another_users_collection(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $collection = Collection::create([
            'user_id' => $owner->id,
            'name' => 'Privada',
        ]);

        Sanctum::actingAs($otherUser);

        $this->patchJson("/api/collections/{$collection->id}", [
            'is_pinned' => true,
        ])->assertNotFound();
    }

    public function test_a_collection_can_be_deleted_without_deleting_its_works(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $collection = $this->postJson('/api/collections', [
            'name' => 'Para excluir',
        ])->assertCreated()->json();
        $work = Work::create(['title' => 'Obra preservada']);
        $this->postJson("/api/collections/{$collection['id']}/works", [
            'work_id' => $work->id,
        ])->assertOk();

        $this->deleteJson("/api/collections/{$collection['id']}")->assertNoContent();

        $this->assertDatabaseMissing('collections', ['id' => $collection['id']]);
        $this->assertDatabaseMissing('collection_work', ['collection_id' => $collection['id']]);
        $this->assertDatabaseHas('works', ['id' => $work->id, 'title' => 'Obra preservada']);
    }

    public function test_a_user_cannot_delete_another_users_collection(): void
    {
        $collection = Collection::create([
            'user_id' => User::factory()->create()->id,
            'name' => 'Privada',
        ]);
        Sanctum::actingAs(User::factory()->create());

        $this->deleteJson("/api/collections/{$collection->id}")->assertNotFound();
        $this->assertDatabaseHas('collections', ['id' => $collection->id]);
    }
}
