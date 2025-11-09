<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePaymentGatewayRequest;
use App\Models\PaymentGateway;
use App\Services\Payments\PaymentGatewayManager;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PaymentGatewayController extends Controller
{
    public function __construct(protected PaymentGatewayManager $gatewayManager)
    {
    }

    public function edit(): Response
    {
        $gateway = $this->gatewayManager->activeGateway();

        return Inertia::render('Admin/Settings/Payments', [
            'gateway' => [
                'id' => $gateway->id,
                'name' => $gateway->name,
                'slug' => $gateway->slug,
                'is_active' => $gateway->is_active,
                'config' => [
                    'publishable_key' => $gateway->config['publishable_key'] ?? '',
                    'secret_key' => $gateway->config['secret_key'] ?? '',
                    'webhook_secret' => $gateway->config['webhook_secret'] ?? '',
                ],
            ],
        ]);
    }

    public function update(UpdatePaymentGatewayRequest $request): RedirectResponse
    {
        $gateway = $this->gatewayManager->activeGateway();

        $config = $gateway->config ?? [];
        $config['publishable_key'] = $request->input('publishable_key');
        $config['secret_key'] = $request->input('secret_key');
        $config['webhook_secret'] = $request->input('webhook_secret');

        $gateway->update([
            'config' => $config,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Stripe credentials updated successfully. Test a ₹1 card transaction before going live.');
    }
}
