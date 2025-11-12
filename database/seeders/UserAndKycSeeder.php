<?php

namespace Database\Seeders;

use App\Enums\KycStatus;
use App\Enums\UserType;
use App\Models\Customer;
use App\Models\User;
use App\Models\UserKycDocument;
use App\Models\UserKycProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserAndKycSeeder extends Seeder
{
    public function run(): void
    {
        $adminAccounts = [
            [
                'email' => 'admin@b2b.test',
                'attributes' => [
                    'name' => 'Demo Super Admin',
                    'password' => Hash::make('password'),
                    'type' => UserType::SuperAdmin->value,
                ],
                'factoryState' => 'admin',
            ],
            [
                'email' => 'sales@b2b.test',
                'attributes' => [
                    'name' => 'Demo Sales Manager',
                    'password' => Hash::make('password'),
                    'type' => UserType::Sales->value,
                ],
            ],
            [
                'email' => 'production@b2b.test',
                'attributes' => [
                    'name' => 'Demo Production Lead',
                    'password' => Hash::make('password'),
                    'type' => UserType::Production->value,
                ],
                'factoryState' => 'production',
            ],
        ];

        foreach ($adminAccounts as $admin) {
            $attributes = $admin['attributes'] + ['email' => $admin['email']];

            $existing = User::where('email', $admin['email'])->first();

            if ($existing) {
                $existing->update($attributes);
                continue;
            }

            $factory = User::factory();
            if (isset($admin['factoryState']) && method_exists($factory, $admin['factoryState'])) {
                $factory = $factory->{$admin['factoryState']}();
            }

            $factory->create($attributes);
        }

        $customerPrimaries = [
            [
                'email' => 'retailer@b2b.test',
                'attributes' => [
                    'name' => 'Demo Retailer',
                    'password' => Hash::make('password'),
                    'type' => UserType::Retailer->value,
                    'kyc_status' => KycStatus::Approved->value,
                    'phone' => '9822310801',
                ],
                'factoryState' => 'retailer',
            ],
            [
                'email' => 'wholesaler@b2b.test',
                'attributes' => [
                    'name' => 'Demo Wholesaler',
                    'password' => Hash::make('password'),
                    'type' => UserType::Wholesaler->value,
                    'kyc_status' => KycStatus::Approved->value,
                    'phone' => '9822310802',
                ],
                'factoryState' => 'wholesaler',
            ],
        ];

        foreach ($customerPrimaries as $primary) {
            $attributes = $primary['attributes'] + ['email' => $primary['email']];

            $existing = Customer::where('email', $primary['email'])->first();

            if ($existing) {
                $existing->update($attributes);
                continue;
            }

            $factory = Customer::factory();
            if (isset($primary['factoryState']) && method_exists($factory, $primary['factoryState'])) {
                $factory = $factory->{$primary['factoryState']}();
            }

            $factory->create($attributes);
        }

        if (Customer::where('type', UserType::Retailer->value)->count() < 20) {
            Customer::factory()
                ->count(20)
                ->retailer()
                ->approved()
                ->create();
        }

        if (Customer::where('type', UserType::Wholesaler->value)->count() < 20) {
            Customer::factory()
                ->count(20)
                ->wholesaler()
                ->approved()
                ->create();
        }

        if (Customer::where('type', UserType::Retailer->value)->where('kyc_status', KycStatus::Pending->value)->count() < 5) {
            Customer::factory()
                ->count(5)
                ->retailer()
                ->create([
                    'kyc_status' => KycStatus::Pending->value,
                ]);
        }

        if (Customer::where('type', UserType::Wholesaler->value)->where('kyc_status', KycStatus::Pending->value)->count() < 5) {
            Customer::factory()
                ->count(5)
                ->wholesaler()
                ->create([
                    'kyc_status' => KycStatus::Pending->value,
                ]);
        }

        Customer::all()->each(function (Customer $user): void {
            if (! $user->kycProfile) {
                $user->kycProfile()->create(UserKycProfile::factory()->make()->toArray());
            }

            if ($user->kycDocuments()->count() >= 2) {
                return;
            }

            UserKycDocument::factory()
                ->count(2 - $user->kycDocuments()->count())
                ->for($user, 'user')
                ->create();
        });
    }
}
