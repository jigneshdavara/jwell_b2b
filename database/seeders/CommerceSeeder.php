<?php

namespace Database\Seeders;

use App\Enums\KycStatus;
use App\Enums\UserType;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Seeder;

class CommerceSeeder extends Seeder
{
    public function run(): void
    {
        $customers = Customer::query()
            ->whereIn('type', [UserType::Retailer->value, UserType::Wholesaler->value])
            ->where('kyc_status', KycStatus::Approved->value)
            ->get();

        $products = Product::all();

        // Ensure at least 20 carts
        $customers->random(min(20, $customers->count()))->each(function (Customer $customer) use ($products): void {
            $cart = Cart::factory()
                ->for($customer)
                ->create();

            CartItem::factory()
                ->count(3)
                ->state(fn () => [
                    'product_id' => $products->random()->id,
                ])
                ->for($cart)
                ->create();
        });

        // Create orders with items
        $customers->random(min(30, $customers->count()))->each(function (Customer $customer) use ($products): void {
            $order = Order::factory()
                ->for($customer)
                ->create();

            OrderItem::factory()
                ->count(3)
                ->state(fn () => [
                    'product_id' => $products->random()->id,
                ])
                ->for($order)
                ->create();
        });
    }
}
