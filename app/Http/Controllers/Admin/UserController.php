<?php

namespace App\Http\Controllers\Admin;

use App\Enums\KycStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateKycStatusRequest;
use App\Http\Requests\Admin\UpdateUserGroupAssignmentRequest;
use App\Models\User;
use App\Models\UserGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $statusFilter = $request->string('status')->lower()->value();

        $statusValues = collect(KycStatus::cases())->pluck('value')->all();

        $usersQuery = User::query()
            ->with(['kycDocuments', 'kycProfile', 'userGroup'])
            ->latest();

        if ($statusFilter && in_array($statusFilter, $statusValues, true)) {
            $usersQuery->where('kyc_status', $statusFilter);
        }

        $users = $usersQuery
            ->paginate(20)
            ->withQueryString()
            ->through(function (User $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'type' => Str::headline($user->type ?? ''),
                    'kyc_status' => $user->kyc_status,
                    'kyc_status_label' => Str::headline($user->kyc_status ?? ''),
                    'kyc_notes' => $user->kyc_notes,
                    'kyc_document_count' => $user->kycDocuments->count(),
                    'user_group' => $user->userGroup ? [
                        'id' => $user->userGroup->id,
                        'name' => $user->userGroup->name,
                    ] : null,
                    'kyc_profile' => $user->kycProfile ? [
                        'business_name' => $user->kycProfile->business_name,
                        'city' => $user->kycProfile->city,
                        'state' => $user->kycProfile->state,
                    ] : null,
                    'joined_at' => optional($user->created_at)?->toDateTimeString(),
                ];
            });

        $stats = [
            'total' => User::count(),
            'pending' => User::where('kyc_status', KycStatus::Pending->value)->count(),
            'review' => User::where('kyc_status', KycStatus::Review->value)->count(),
            'approved' => User::where('kyc_status', KycStatus::Approved->value)->count(),
            'rejected' => User::where('kyc_status', KycStatus::Rejected->value)->count(),
        ];

        $userGroups = UserGroup::query()
            ->where('is_active', true)
            ->orderBy('position')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (UserGroup $group) => [
                'id' => $group->id,
                'name' => $group->name,
            ]);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'kycStatuses' => $statusValues,
            'filters' => [
                'status' => $statusFilter,
            ],
            'stats' => $stats,
            'userGroups' => $userGroups,
        ]);
    }

    public function updateKycStatus(UpdateKycStatusRequest $request, User $user): RedirectResponse
    {
        $remarks = trim((string) $request->input('remarks')) ?: null;

        $user->update([
            'kyc_status' => $request->get('status'),
            'kyc_notes' => $remarks,
        ]);

        return redirect()
            ->back()
            ->with('success', 'KYC status updated successfully.');
    }

    public function updateGroup(UpdateUserGroupAssignmentRequest $request, User $user): RedirectResponse
    {
        $user->update([
            'user_group_id' => $request->validated('user_group_id'),
        ]);

        return redirect()
            ->back()
            ->with('success', 'User group updated successfully.');
    }
}
