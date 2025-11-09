<?php

namespace App\Http\Controllers\Auth;

use App\Enums\KycStatus;
use App\Enums\UserType;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserKycProfile;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'phone' => ['required', 'string', 'max:25'],
            'account_type' => ['required', Rule::in([UserType::Retailer->value, UserType::Wholesaler->value])],
            'business_name' => ['required', 'string', 'max:255'],
            'gst_number' => ['nullable', 'string', 'max:50'],
            'pan_number' => ['nullable', 'string', 'max:50'],
            'registration_number' => ['nullable', 'string', 'max:100'],
            'address_line1' => ['nullable', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'state' => ['nullable', 'string', 'max:120'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:120'],
            'website' => ['nullable', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:25'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'type' => $request->string('account_type')->value(),
            'kyc_status' => KycStatus::Pending->value,
            'kyc_notes' => null,
        ]);

        UserKycProfile::create([
            'user_id' => $user->id,
            'business_name' => $request->business_name,
            'business_website' => $request->website,
            'gst_number' => $request->gst_number,
            'pan_number' => $request->pan_number,
            'registration_number' => $request->registration_number,
            'address_line1' => $request->address_line1,
            'address_line2' => $request->address_line2,
            'city' => $request->city,
            'state' => $request->state,
            'postal_code' => $request->postal_code,
            'country' => $request->country ?: 'India',
            'contact_name' => $request->contact_name ?: $request->name,
            'contact_phone' => $request->contact_phone ?: $request->phone,
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('onboarding.kyc.show', absolute: false))
            ->with('success', 'Thanks for registering! Complete your KYC to unlock wholesale access.');
    }
}
