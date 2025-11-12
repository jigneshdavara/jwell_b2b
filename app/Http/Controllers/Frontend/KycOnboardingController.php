<?php

namespace App\Http\Controllers\Frontend;

use App\Enums\KycStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Frontend\Kyc\SendKycMessageRequest;
use App\Http\Requests\Frontend\Kyc\StoreKycDocumentRequest;
use App\Http\Requests\Frontend\Kyc\UpdateKycProfileRequest;
use App\Models\UserKycDocument;
use App\Models\UserKycMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class KycOnboardingController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();

        $user->loadMissing(['kycProfile', 'kycDocuments', 'kycMessages.admin']);

        if (! $user->kycProfile) {
            $user->kycProfile()->create([
                'business_name' => $user->name.' Enterprises',
                'country' => 'India',
                'contact_name' => $user->name,
                'contact_phone' => $user->phone,
            ]);
            $user->load('kycProfile');
        }

        return Inertia::render('Onboarding/Kyc/Show', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'type' => $user->type,
                'kyc_status' => $user->kyc_status,
                'kyc_notes' => $user->kyc_notes,
            ],
            'profile' => $user->kycProfile ? [
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
            'documents' => $user->kycDocuments->map(function (UserKycDocument $document) {
                return [
                    'id' => $document->id,
                    'type' => $document->type,
                    'status' => $document->status,
                    'remarks' => $document->remarks,
                    'url' => $document->file_path ? Storage::url($document->file_path) : null,
                    'download_url' => route('onboarding.kyc.documents.download', $document),
                    'uploaded_at' => $document->created_at?->toDateTimeString(),
                ];
            }),
            'documentTypes' => (new StoreKycDocumentRequest())->documentTypes(),
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
            'can_customer_reply' => (bool) $user->kyc_comments_enabled,
        ]);
    }

    public function updateProfile(UpdateKycProfileRequest $request): RedirectResponse
    {
        $user = $request->user();
        $profile = $user->kycProfile;

        if (! $profile) {
            $profile = $user->kycProfile()->create([]);
        }

        $profile->update($request->validated());

        $this->markUserPending($user);

        return redirect()
            ->back()
            ->with('success', 'Business profile updated. Our compliance team will re-review shortly.');
    }

    public function storeDocument(StoreKycDocumentRequest $request): RedirectResponse
    {
        $user = $request->user();
        $path = $request->file('document_file')->store("kyc/{$user->id}", 'public');

        $user->kycDocuments()->create([
            'type' => $request->document_type,
            'file_path' => $path,
            'status' => 'pending',
        ]);

        $this->markUserPending($user);

        return redirect()
            ->back()
            ->with('success', 'Document uploaded successfully.');
    }

    public function destroyDocument(Request $request, UserKycDocument $document): RedirectResponse
    {
        $user = $request->user();

        if ($document->user_id !== $user->id) {
            abort(403);
        }

        if ($document->file_path) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        $this->markUserPending($user);

        return redirect()
            ->back()
            ->with('success', 'Document removed.');
    }

    public function storeMessage(SendKycMessageRequest $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->kyc_comments_enabled) {
            abort(403);
        }

        $user->kycMessages()->create([
            'sender_type' => 'customer',
            'message' => $request->string('message')->trim()->toString(),
        ]);

        if (! in_array($user->kyc_status, [KycStatus::Approved->value, KycStatus::Review->value], true)) {
            $user->forceFill([
                'kyc_status' => KycStatus::Review->value,
            ])->save();
        }

        return back()->with('success', 'Message sent to the compliance team.');
    }

    public function downloadDocument(Request $request, UserKycDocument $document)
    {
        $user = $request->user();

        if ($document->user_id !== $user->id) {
            abort(403);
        }

        if (! $document->file_path || ! Storage::disk('public')->exists($document->file_path)) {
            abort(404);
        }

        return Storage::disk('public')->download(
            $document->file_path,
            $document->type.'-'.basename($document->file_path)
        );
    }

    protected function markUserPending($user): void
    {
        if ($user->kyc_status === KycStatus::Approved->value) {
            return;
        }

        $user->forceFill([
            'kyc_status' => KycStatus::Pending->value,
            'kyc_notes' => null,
        ])->save();
    }
}
