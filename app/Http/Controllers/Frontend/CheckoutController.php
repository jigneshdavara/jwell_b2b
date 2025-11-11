<?php

namespace App\Http\Controllers\Frontend;

use App\Exceptions\PaymentGatewayException;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Frontend\Checkout\ConfirmCheckoutRequest;
use App\Models\Payment;
use App\Models\Order;
use App\Services\CartService;
use App\Services\CheckoutService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        protected CartService $cartService,
        protected CheckoutService $checkoutService
    ) {
    }

    public function show(): RedirectResponse|Response
    {
        $user = Auth::user();
        $cart = $this->cartService->getActiveCart($user);
        $cart->load('items.product');

        if ($cart->items->isEmpty()) {
            return redirect()->route('frontend.catalog.index')->with('info', 'Your purchase list is empty. Add designs before checkout.');
        }

        $state = $this->checkoutService->initialize($cart);
        $paymentMeta = $state['payment'];

        return Inertia::render('Frontend/Checkout/Index', [
            'order' => [
                'reference' => $state['order']->reference,
                'total' => $state['total'],
                'currency' => $state['currency'],
                'items' => $state['items'],
            ],
            'payment' => [
                'publishableKey' => $paymentMeta['publishable_key'],
                'clientSecret' => $paymentMeta['client_secret'],
                'paymentId' => $paymentMeta['payment_id'],
                'providerReference' => $paymentMeta['provider_reference'],
            ],
            'summary' => [
                'subtotal' => $state['subtotal'],
                'tax' => $state['tax'],
                'discount' => $state['discount'],
                'shipping' => $state['shipping'],
                'total' => $state['total'],
                'currency' => $state['currency'],
            ],
        ]);
    }

    public function payOrder(Order $order): RedirectResponse|Response
    {
        abort_unless($order->user_id === Auth::id(), 403);

        if (! in_array($order->status?->value ?? $order->status, [OrderStatus::PendingPayment->value, OrderStatus::PaymentFailed->value], true)) {
            return redirect()->route('frontend.orders.show', $order)->with('info', 'This order is not awaiting payment.');
        }

        $state = $this->checkoutService->initializeExistingOrder($order);

        return Inertia::render('Frontend/Checkout/Index', [
            'order' => [
                'reference' => $state['order']->reference,
                'total' => $state['total'],
                'currency' => $state['currency'],
                'items' => $state['order']->items->map(fn ($item) => [
                    'sku' => $item->sku,
                    'name' => $item->name,
                    'quantity' => $item->quantity,
                    'line_total' => $item->total_price,
                ]),
            ],
            'payment' => [
                'publishableKey' => $state['payment']['publishable_key'],
                'clientSecret' => $state['payment']['client_secret'],
                'providerReference' => $state['payment']['provider_reference'],
            ],
            'summary' => [
                'subtotal' => $state['subtotal'],
                'tax' => $state['tax'],
                'discount' => $state['discount'],
                'shipping' => $state['shipping'],
                'total' => $state['total'],
                'currency' => $state['currency'],
            ],
        ]);
    }

    public function confirm(ConfirmCheckoutRequest $request): RedirectResponse
    {
        $payment = Payment::query()
            ->where('provider_reference', $request->input('payment_intent_id'))
            ->whereHas('order', fn ($query) => $query->where('user_id', $request->user()->id))
            ->firstOrFail();

        try {
            $order = $this->checkoutService->finalize($payment);
        } catch (PaymentGatewayException $exception) {
            return redirect()
                ->back()
                ->with('error', $exception->getMessage());
        }

        $cart = $this->cartService->getActiveCart($request->user());
        $this->cartService->clear($cart);

        return redirect()
            ->route('dashboard')
            ->with('success', 'Order '.$order->reference.' confirmed. Production planning is underway.');
    }
}
