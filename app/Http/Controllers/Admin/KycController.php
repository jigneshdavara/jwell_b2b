<?php

namespace App\Http\Controllers\Admin;

use App\Enums\KycStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateKycDocumentRequest;
use App\Models\User;
use App\Models\UserKycDocument;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class KycController extends Controller
{
    protected array $documentStatuses = ['pending', 'approved', 'rejected', 'needs_revision'];

    public function show(User $user): Response
    {
        $user->load(['kycDocuments', 'kycProfile']);

        return Inertia::render('Admin/Users/KycReview', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'kyc_status' => $user->kyc_status,
                'kyc_status_label' => Str::headline($user->kyc_status ?? ''),
                'kyc_notes' => $user->kyc_notes,
                'kyc_profile' => $user->kycProfile ? [
                    'business_name' => $user->kycProfile->business_name,
                    'business_website' => $user->kycProfile->business_website,
                    'gst_number' => $user->kycProfile->gst_number,
                    'pan_number' => $user->kycProfile->pan_number,
                    'registration_number' => $user->kycProfile->registration_number,
                    'address_line1' => $user->kycProfile->address_line1,
                    'address_line2' => $user->kycProfile->address_line2,
                    'city' => $user->kycProfile->city,
                    'state' => $user->kycProfile->state,
                    'postal_code' => $user->kycProfile->postal_code,
                    'country' => $user->kycProfile->country,
                    'contact_name' => $user->kycProfile->contact_name,
                    'contact_phone' => $user->kycProfile->contact_phone,
                ] : null,
                'kyc_documents' => $user->kycDocuments->map(function (UserKycDocument $document) {
                    return [
                        'id' => $document->id,
                        'type' => Str::headline($document->type ?? 'Document'),
                        'status' => $document->status,
                        'file_path' => $document->file_path,
                        'file_url' => $document->file_path ? Storage::url($document->file_path) : null,
                        'remarks' => $document->remarks,
                    ];
                }),
            ],
            'statuses' => collect(KycStatus::cases())->map(fn (KycStatus $status) => [
                'value' => $status->value,
                'label' => Str::headline($status->value),
            ]),
            'documentStatuses' => collect($this->documentStatuses)->map(fn (string $status) => [
                'value' => $status,
                'label' => Str::headline($status),
            ]),
        ]);
    }

    public function updateDocument(UpdateKycDocumentRequest $request, UserKycDocument $document): RedirectResponse
    {
        $document->update($request->validated());

        return redirect()
            ->back()
            ->with('success', 'Document feedback saved.');
    }
}
