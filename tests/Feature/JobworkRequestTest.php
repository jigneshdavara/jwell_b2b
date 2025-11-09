<?php

namespace Tests\Feature;

use App\Enums\KycStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JobworkRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_submit_jobwork_request(): void
    {
        $user = User::factory()->retailer()->approved()->create([
            'kyc_status' => KycStatus::Approved->value,
        ]);

        $payload = [
            'submission_mode' => 'custom',
            'type' => 'customer_supplied',
            'reference_design' => 'Need setting identical to sample 123',
            'reference_url' => 'https://example.com/design.pdf',
            'metal' => 'Gold',
            'purity' => '18K',
            'diamond_quality' => 'VVS',
            'quantity' => 2,
            'special_instructions' => 'Please expedite order.',
            'delivery_deadline' => now()->addWeeks(2)->format('Y-m-d'),
        ];

        $response = $this->actingAs($user)->post(route('frontend.jobwork.store'), $payload);

        $response->assertRedirect(route('frontend.jobwork.index'));
        $response->assertSessionHas('success', 'Jobwork request submitted successfully. Our production desk will connect with you shortly.');

        $this->assertDatabaseCount('jobwork_requests', 1);
    }

    public function test_guest_cannot_submit_jobwork_request(): void
    {
        $payload = [
            'type' => 'vendor_supplied',
            'metal' => 'Gold',
            'purity' => '18K',
            'quantity' => 1,
        ];

        $response = $this->post(route('frontend.jobwork.store'), $payload);

        $response->assertRedirect(route('login'));
        $this->assertDatabaseCount('jobwork_requests', 0);
    }
}
