<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\KycStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Cart;
use App\Models\Customer;
use App\Models\PaymentGateway;
use App\Models\Product;
use App\Services\Payments\Drivers\FakeGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartCheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['payments.default' => 'fake']);

        PaymentGateway::factory()->create([
            'slug' => 'fake',
            'name' => 'Fake Gateway',
            'driver' => FakeGateway::class,
            'is_active' => true,
            'is_default' => true,
        ]);
    }

    public function test_user_can_add_product_to_cart(): void
    {
        $user = Customer::factory()->retailer()->approved()->create([
            'kyc_status' => KycStatus::Approved->value,
        ]);
        $product = Product::factory()->create();

        $response = $this->actingAs($user)->post(route('frontend.cart.items.store'), [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('cart_items', [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);
    }

    public function test_checkout_flow_creates_order_and_completes_payment(): void
    {
        $user = Customer::factory()->retailer()->approved()->create([
            'kyc_status' => KycStatus::Approved->value,
        ]);
        $product = Product::factory()->create([
            'base_price' => 10000,
            'making_charge' => 2500,
        ]);

        $this->actingAs($user)->post(route('frontend.cart.items.store'), [
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($user)->get(route('frontend.checkout.show'));
        $response->assertOk();

        $order = $user->orders()->latest()->first();
        $this->assertNotNull($order);
        $this->assertSame(OrderStatus::PendingPayment, $order->status);
        $this->assertSame(12500.0, $order->total_amount);

        $payment = $order->payments()->first();
        $this->assertNotNull($payment);
        $this->assertSame(PaymentStatus::Pending, $payment->status);

        $confirm = $this->actingAs($user)->post(route('frontend.checkout.confirm'), [
            'payment_intent_id' => $payment->provider_reference,
        ]);

        $confirm->assertRedirect(route('dashboard'));

        $order->refresh();
        $payment->refresh();

        $this->assertSame(OrderStatus::Pending, $order->status);
        $this->assertSame(PaymentStatus::Succeeded, $payment->status);

        $activeCart = Cart::where('user_id', $user->id)->latest()->first();
        $this->assertNotNull($activeCart);
        $this->assertSame(0, $activeCart->items()->count());
    }
}
