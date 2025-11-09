<?php

namespace Database\Seeders;

use App\Enums\KycStatus;
use App\Enums\UserType;
use App\Models\User;
use App\Models\UserKycDocument;
use App\Models\UserKycProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserAndKycSeeder extends Seeder
{
    public function run(): void
    {
        $primaries = [
            [
                'email' => 'admin@b2b.test',
                'attributes' => [
                    'name' => 'Demo Super Admin',
                    'password' => Hash::make('password'),
                    'type' => UserType::SuperAdmin->value,
                    'kyc_status' => KycStatus::Approved->value,
                    'phone' => '9822310798',
                ],
                'factoryState' => 'admin',
            ],
            [
                'email' => 'sales@b2b.test',
                'attributes' => [
                    'name' => 'Demo Sales Manager',
                    'password' => Hash::make('password'),
                    'type' => UserType::Sales->value,
                    'kyc_status' => KycStatus::Approved->value,
                    'phone' => '9822310799',
                ],
            ],
            [
                'email' => 'production@b2b.test',
                'attributes' => [
                    'name' => 'Demo Production Lead',
                    'password' => Hash::make('password'),
                    'type' => UserType::Production->value,
                    'kyc_status' => KycStatus::Approved->value,
                    'phone' => '9822310800',
                ],
                'factoryState' => 'production',
            ],
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

        foreach ($primaries as $primary) {
            $attributes = $primary['attributes'] + ['email' => $primary['email']];

            $existing = User::where('email', $primary['email'])->first();

            if ($existing) {
                $existing->update($attributes);
                continue;
            }

            $factory = User::factory();
            if (isset($primary['factoryState']) && method_exists($factory, $primary['factoryState'])) {
                $factory = $factory->{$primary['factoryState']}();
            }

            $factory->create($attributes);
        }

        if (User::where('type', UserType::Retailer->value)->count() < 20) {
            User::factory()
                ->count(20)
                ->retailer()
                ->approved()
                ->create();
        }

        if (User::where('type', UserType::Wholesaler->value)->count() < 20) {
            User::factory()
                ->count(20)
                ->wholesaler()
                ->approved()
                ->create();
        }

        if (User::where('type', UserType::Retailer->value)->where('kyc_status', KycStatus::Pending->value)->count() < 5) {
            User::factory()
                ->count(5)
                ->retailer()
                ->create([
                    'kyc_status' => KycStatus::Pending->value,
                ]);
        }

        if (User::where('type', UserType::Wholesaler->value)->where('kyc_status', KycStatus::Pending->value)->count() < 5) {
            User::factory()
                ->count(5)
                ->wholesaler()
                ->create([
                    'kyc_status' => KycStatus::Pending->value,
                ]);
        }

        User::all()->each(function (User $user): void {
            if (! $user->kycProfile) {
                $user->kycProfile()->create(UserKycProfile::factory()->make()->toArray());
            }

            if ($user->kycDocuments()->count() >= 2) {
                return;
            }

            UserKycDocument::factory()
                ->count(2 - $user->kycDocuments()->count())
                ->for($user)
                ->create();
        });
    }
}
