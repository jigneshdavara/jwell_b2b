<?php

namespace Tests\Feature;

use App\Enums\KycStatus;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KycMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_pending_kyc_user_is_redirected_from_catalog(): void
    {
        $user = Customer::factory()->retailer()->create([
            'kyc_status' => KycStatus::Pending->value,
        ]);

        $response = $this->actingAs($user)->get('/catalog');

        $response->assertRedirect(route('onboarding.kyc.show'));
        $response->assertSessionHas('status', 'kyc_pending');
    }

    public function test_approved_user_can_access_catalog(): void
    {
        $user = Customer::factory()->retailer()->approved()->create([
            'kyc_status' => KycStatus::Approved->value,
        ]);

        $response = $this->actingAs($user)->get('/catalog');

        $response->assertOk();
    }
}
