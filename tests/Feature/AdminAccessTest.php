<?php

namespace Tests\Feature;

use App\Enums\KycStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_user_can_access_admin_dashboard(): void
    {
        $admin = User::factory()->admin()->create([
            'kyc_status' => KycStatus::Approved->value,
        ]);

        $response = $this->actingAs($admin)->get('/admin/dashboard');

        $response->assertOk();
    }

    public function test_retailer_cannot_access_admin_dashboard(): void
    {
        $retailer = User::factory()->retailer()->approved()->create([
            'kyc_status' => KycStatus::Approved->value,
        ]);

        $response = $this->actingAs($retailer)->get('/admin/dashboard');

        $response->assertForbidden();
    }

    public function test_admin_redirected_from_customer_portal_routes(): void
    {
        $admin = User::factory()->admin()->create([
            'kyc_status' => KycStatus::Approved->value,
        ]);

        $response = $this->actingAs($admin)->get(route('frontend.cart.index'));

        $response->assertRedirect(route('admin.dashboard'));
        $response->assertSessionHas('error', 'Access limited to approved retail partners.');
    }
}
