<?php

namespace App\Http\Controllers\Admin;

use App\Enums\KycStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreKycMessageRequest;
use App\Http\Requests\Admin\UpdateKycCommentsSettingRequest;
use App\Http\Requests\Admin\UpdateKycDocumentRequest;
use App\Models\Customer;
use App\Models\UserKycDocument;
use App\Models\UserKycMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class KycController extends Controller
{
    protected array $documentStatuses = ['pending', 'approved', 'rejected', 'needs_revision'];

    public function show(Customer $user): Response
    {
        $user->load(['kycDocuments', 'kycProfile', 'kycMessages.admin']);

        return Inertia::render('Admin/Users/KycReview', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'type' => $user->type,
                'kyc_status' => $user->kyc_status,
                'kyc_status_label' => Str::headline($user->kyc_status ?? ''),
                'kyc_notes' => $user->kyc_notes,
                'comments_enabled' => (bool) $user->kyc_comments_enabled,
                'created_at' => $user->created_at?->toDateTimeString(),
                'updated_at' => $user->updated_at?->toDateTimeString(),
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
                    'created_at' => $user->kycProfile->created_at?->toDateTimeString(),
                    'updated_at' => $user->kycProfile->updated_at?->toDateTimeString(),
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
            'messages' => $user->kycMessages
                ->sortBy('created_at')
                ->values()
                ->map(function (UserKycMessage $message) {
                    return [
                        'id' => $message->id,
                        'sender_type' => $message->sender_type,
                        'message' => $message->message,
                        'created_at' => $message->created_at?->toDateTimeString(),
                        'admin' => $message->admin ? [
                            'id' => $message->admin->id,
                            'name' => $message->admin->name,
                        ] : null,
                    ];
                }),
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

    public function storeMessage(StoreKycMessageRequest $request, Customer $user): RedirectResponse
    {
        $user->kycMessages()->create([
            'sender_type' => 'admin',
            'admin_id' => $request->user()->id,
            'message' => $request->string('message')->trim()->toString(),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Message sent to the customer.');
    }

    public function updateCommentsSetting(UpdateKycCommentsSettingRequest $request, Customer $user): RedirectResponse
    {
        $user->update([
            'kyc_comments_enabled' => $request->boolean('allow_replies'),
        ]);

        return redirect()
            ->back()
            ->with('success', 'KYC messaging preferences updated.');
    }
}
