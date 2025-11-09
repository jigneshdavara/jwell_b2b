<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '9812345678',
            'account_type' => 'retailer',
            'business_name' => 'Test Jewels',
            'gst_number' => '27ABCDE1234F1Z5',
            'pan_number' => 'ABCDE1234F',
            'registration_number' => 'CIN1234567',
            'address_line1' => '123 Test Street',
            'address_line2' => 'Near Bazaar',
            'city' => 'Mumbai',
            'state' => 'Maharashtra',
            'postal_code' => '400001',
            'country' => 'India',
            'website' => 'https://test.example',
            'contact_name' => 'Test User',
            'contact_phone' => '9812345678',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('onboarding.kyc.show', absolute: false));
    }
}
