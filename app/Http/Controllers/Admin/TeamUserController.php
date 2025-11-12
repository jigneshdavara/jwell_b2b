<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyTeamUsersRequest;
use App\Http\Requests\Admin\StoreTeamUserRequest;
use App\Http\Requests\Admin\UpdateTeamUserRequest;
use App\Http\Requests\Admin\UpdateUserGroupAssignmentRequest;
use App\Models\User;
use App\Models\UserGroup;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TeamUserController extends Controller
{
    protected const INTERNAL_TYPES = [
        UserType::Admin,
        UserType::SuperAdmin,
        UserType::Production,
        UserType::Sales,
    ];

    public function index(): Response
    {
        $users = User::query()
            ->with(['userGroup'])
            ->whereIn('type', collect(self::INTERNAL_TYPES)->map->value->all())
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(function (User $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'type' => $user->type,
                    'type_label' => Str::headline($user->type ?? ''),
                    'user_group' => $user->userGroup ? [
                        'id' => $user->userGroup->id,
                        'name' => $user->userGroup->name,
                    ] : null,
                    'joined_at' => optional($user->created_at)?->toDateTimeString(),
                ];
            });

        $userGroups = UserGroup::query()
            ->where('is_active', true)
            ->orderBy('position')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (UserGroup $group) => [
                'id' => $group->id,
                'name' => $group->name,
            ]);

        $availableTypes = collect(self::INTERNAL_TYPES)
            ->map(fn (UserType $type) => [
                'value' => $type->value,
                'label' => Str::headline($type->value),
            ])
            ->values();

        return Inertia::render('Admin/UserManagement/Team/Index', [
            'users' => $users,
            'userGroups' => $userGroups,
            'availableTypes' => $availableTypes,
        ]);
    }

    public function store(StoreTeamUserRequest $request)
    {
        $data = $request->validated();

        $user = new User();
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->password = Hash::make($data['password']);
        $user->type = $data['type'] ?? UserType::Admin->value;
        $user->user_group_id = $data['user_group_id'] ?? null;
        $user->save();

        return redirect()
            ->back()
            ->with('success', 'Team user created successfully.');
    }

    public function update(UpdateTeamUserRequest $request, User $user)
    {
        if (! $this->isInternalUser($user)) {
            abort(403);
        }

        $data = $request->validated();

        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->user_group_id = $data['user_group_id'] ?? null;

        if (! empty($data['type']) && $user->type !== UserType::SuperAdmin->value) {
            $user->type = $data['type'];
        } elseif (! empty($data['type']) && $user->type === UserType::SuperAdmin->value && $data['type'] === UserType::SuperAdmin->value) {
            $user->type = $data['type'];
        }

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        return redirect()
            ->back()
            ->with('success', 'Team user updated successfully.');
    }

    public function updateGroup(UpdateUserGroupAssignmentRequest $request, User $user)
    {
        if (! $this->isInternalUser($user)) {
            abort(403);
        }

        $user->update([
            'user_group_id' => $request->validated('user_group_id'),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Access group updated successfully.');
    }

    public function destroy(User $user)
    {
        if (! $this->isInternalUser($user) || $this->isProtectedUser($user)) {
            abort(403);
        }

        $user->delete();

        return redirect()
            ->back()
            ->with('success', 'Team user deleted successfully.');
    }

    public function bulkDestroy(BulkDestroyTeamUsersRequest $request)
    {
        $ids = collect($request->validated('ids'))
            ->unique()
            ->filter(function (int $id) {
                $user = User::find($id);
                return $user && $this->isInternalUser($user) && ! $this->isProtectedUser($user);
            })
            ->all();

        if (! empty($ids)) {
            User::whereIn('id', $ids)->delete();
        }

        return redirect()
            ->back()
            ->with('success', 'Selected team users deleted successfully.');
    }

    protected function isInternalUser(User $user): bool
    {
        return in_array($user->type, collect(self::INTERNAL_TYPES)->map->value->all(), true);
    }

    protected function isProtectedUser(User $user): bool
    {
        return $user->type === UserType::SuperAdmin->value;
    }
}

