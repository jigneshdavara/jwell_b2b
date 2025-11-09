<?php

namespace Tests\Feature;

use App\Models\PriceRate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiRateEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_rates_endpoint_requires_authentication(): void
    {
        $response = $this->getJson('/api/rates');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_receives_rate_payload(): void
    {
        $user = User::factory()->admin()->create();
        PriceRate::factory()->count(3)->create();

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/rates');

        $response->assertOk();
        $response->assertJsonCount(3, 'data');
    }
}
