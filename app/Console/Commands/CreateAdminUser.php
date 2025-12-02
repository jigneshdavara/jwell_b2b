<?php

namespace App\Console\Commands;

use App\Enums\UserType;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:create 
                            {--name= : User name}
                            {--email= : User email}
                            {--password= : User password}
                            {--type=admin : User type (admin, super-admin, sales, production)}
                            {--group= : User group ID (optional)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new admin user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $name = $this->option('name') ?? $this->ask('Enter user name');
        $email = $this->option('email') ?? $this->ask('Enter email address');
        $password = $this->option('password') ?? $this->secret('Enter password');
        $type = $this->option('type') ?? $this->choice(
            'Select user type',
            ['admin', 'super-admin', 'sales', 'production'],
            'admin'
        );
        $group = $this->option('group');

        // Validate inputs
        $validator = Validator::make([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'type' => $type,
        ], [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'type' => ['required', 'in:admin,super-admin,sales,production'],
        ]);

        if ($validator->fails()) {
            $this->error('Validation failed:');
            foreach ($validator->errors()->all() as $error) {
                $this->error('  - ' . $error);
            }
            return 1;
        }

        // Validate user type
        $userType = match ($type) {
            'admin' => UserType::Admin,
            'super-admin' => UserType::SuperAdmin,
            'sales' => UserType::Sales,
            'production' => UserType::Production,
            default => UserType::Admin,
        };

        // Validate user group if provided
        if ($group) {
            $userGroup = \App\Models\UserGroup::find($group);
            if (!$userGroup) {
                $this->error("User group with ID {$group} not found.");
                return 1;
            }
        }

        // Create user
        try {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'type' => $userType->value,
                'user_group_id' => $group ? (int) $group : null,
                'email_verified_at' => now(),
            ]);

            $this->info("✓ Admin user created successfully!");
            $this->table(
                ['Field', 'Value'],
                [
                    ['ID', $user->id],
                    ['Name', $user->name],
                    ['Email', $user->email],
                    ['Type', $user->type],
                    ['User Group', $user->userGroup?->name ?? 'None'],
                ]
            );

            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to create user: ' . $e->getMessage());
            return 1;
        }
    }
}
