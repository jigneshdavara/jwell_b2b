<?php

namespace App\Http\Controllers\Admin;

use App\Enums\KycStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateKycStatusRequest;
use App\Http\Requests\Admin\UpdateCustomerGroupAssignmentRequest;
use App\Models\Customer;
use App\Models\CustomerGroup;
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
        $search = $request->string('search')->trim()->value();
        $groupFilter = $request->integer('customer_group_id');
        $typeFilter = $request->string('type')->lower()->value();
        $perPage = (int) $request->input('per_page', 20);
        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 20;
        }
        $statusValues = collect(KycStatus::cases())->pluck('value')->all();
        $usersQuery = Customer::query()
            ->with(['kycDocuments', 'kycProfile', 'customerGroup'])
            ->latest();

        if ($statusFilter && in_array($statusFilter, $statusValues, true)) {
            $usersQuery->where('kyc_status', $statusFilter);
        }

        if ($search) {
            $usersQuery->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($groupFilter) {
            $usersQuery->where('customer_group_id', $groupFilter);
        }

        if ($typeFilter) {
            $usersQuery->where('type', $typeFilter);
        }

        if ($request->boolean('only_active')) {
            $usersQuery->where('is_active', true);
        }

        $users = $usersQuery
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Customer $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'type' => Str::headline($user->type ?? ''),
                    'is_active' => (bool) $user->is_active,
                    'kyc_status' => $user->kyc_status,
                    'kyc_status_label' => Str::headline($user->kyc_status ?? ''),
                    'kyc_notes' => $user->kyc_notes,
                    'kyc_document_count' => $user->kycDocuments->count(),
                    'customer_group' => $user->customerGroup ? [
                        'id' => $user->customerGroup->id,
                        'name' => $user->customerGroup->name,
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
            'total' => Customer::count(),
            'pending' => Customer::where('kyc_status', KycStatus::Pending->value)->count(),
            'review' => Customer::where('kyc_status', KycStatus::Review->value)->count(),
            'approved' => Customer::where('kyc_status', KycStatus::Approved->value)->count(),
            'rejected' => Customer::where('kyc_status', KycStatus::Rejected->value)->count(),
        ];

        $customerGroups = CustomerGroup::query()
            ->where('is_active', true)
            ->orderBy('position')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (CustomerGroup $group) => [
                'id' => $group->id,
                'name' => $group->name,
            ]);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'kycStatuses' => $statusValues,
            'filters' => [
                'status' => $statusFilter,
                'search' => $search,
                'customer_group_id' => $groupFilter,
                'type' => $typeFilter,
            ],
            'stats' => $stats,
            'customerGroups' => $customerGroups,
            'perPageOptions' => [10, 25, 50, 100],
        ]);
    }

    public function destroy(Customer $user): RedirectResponse
    {
        $user->delete();

        return redirect()
            ->back()
            ->with('success', 'Customer deleted successfully.');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $ids = collect($request->input('ids', []))->filter()->all();

        if (! empty($ids)) {
            Customer::query()->whereIn('id', $ids)->delete();
        }

        return redirect()
            ->back()
            ->with('success', 'Selected customers deleted.');
    }

    public function bulkGroupUpdate(UpdateCustomerGroupAssignmentRequest $request): RedirectResponse
    {
        $ids = collect($request->input('ids', []))->filter()->all();

        if (! empty($ids)) {
            Customer::query()->whereIn('id', $ids)->update([
                'customer_group_id' => $request->validated('customer_group_id'),
            ]);
        }

        return redirect()
            ->back()
            ->with('success', 'Customer group updated for selected entries.');
    }

    public function toggleStatus(Request $request, Customer $user): RedirectResponse
    {
        $user->update([
            'is_active' => ! $user->is_active,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Customer status updated.');
    }

    public function updateKycStatus(UpdateKycStatusRequest $request, Customer $user): RedirectResponse
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

    public function updateGroup(UpdateCustomerGroupAssignmentRequest $request, Customer $user): RedirectResponse
    {
        $user->update([
            'customer_group_id' => $request->validated('customer_group_id'),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Customer group updated successfully.');
    }
}
