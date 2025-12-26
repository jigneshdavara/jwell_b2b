'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { route } from '@/utils/route';
import { frontendService } from '@/services/frontendService';
import { Head } from '@/components/Head';
import FlashMessage from '@/components/shared/FlashMessage';

import type { CheckoutData } from '@/types';

const currencyFormatter = (currency: string) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    });

function CheckoutForm({ providerReference }: { providerReference: string }) {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        if (!stripe || !elements) return;

        setProcessing(true);
        const result = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
        });

        if (result.error) {
            setError(result.error.message ?? 'Unable to confirm payment.');
            setProcessing(false);
            return;
        }

        const paymentIntentId = result.paymentIntent?.id ?? providerReference;
        try {
            const response = await frontendService.confirmCheckout(paymentIntentId);
            // Show success message and redirect
            router.push(route('frontend.orders.index') + '?order=' + response.data.order.reference);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Payment confirmation failed.');
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement options={{ layout: 'tabs' }} />
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full rounded-full bg-elvee-blue px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy disabled:opacity-60"
            >
                {processing ? 'Processing…' : 'Confirm payment'}
            </button>
        </form>
    );
}

export default function CheckoutPage() {
    const [data, setData] = useState<CheckoutData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        const fetchCheckout = async () => {
            try {
                const response = await frontendService.getCheckout();
                // Map backend response to frontend format
                const checkoutData: CheckoutData = {
                    order: response.data.order,
                    payment: {
                        publishableKey: response.data.payment.publishable_key,
                        clientSecret: response.data.payment.client_secret,
                        paymentId: response.data.payment.payment_id,
                        providerReference: response.data.payment.provider_reference,
                    },
                    summary: response.data.summary,
                };
                setData(checkoutData);
            } catch (error: any) {
                console.error('Failed to fetch checkout data', error);
                setError(error.response?.data?.message || 'Failed to load checkout');
            } finally {
                setLoading(false);
            }
        };
        fetchCheckout();
    }, []);

    const formatter = useMemo(() => currencyFormatter(data?.order.currency || 'INR'), [data?.order.currency]);
    const stripePromise = useMemo(() => data ? loadStripe(data.payment.publishableKey) : null, [data]);
    const elementOptions: StripeElementsOptions | null = useMemo(() => data ? {
        clientSecret: data.payment.clientSecret,
        appearance: { theme: 'stripe' },
    } : null, [data]);

    if (loading) {
        return (
            <>
                <Head title="Checkout" />
                <div className="flex items-center justify-center py-20">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
                </div>
            </>
        );
    }

    if (error || !data) {
        return (
            <>
                <Head title="Checkout" />
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <p className="text-lg font-semibold text-slate-900">{error || 'Failed to load checkout'}</p>
                        <Link href={route('frontend.cart.index')} className="mt-4 text-sm text-elvee-blue hover:underline">
                            Back to cart
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Checkout" />
            <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                        <h1 className="text-2xl font-semibold text-slate-900">Secure payment</h1>
                        <p className="mt-2 text-sm text-slate-500">Order reference <span className="font-semibold text-slate-900">{data.order.reference}</span></p>
                        <div className="mt-6">
                            {stripePromise && elementOptions && (
                                <Elements stripe={stripePromise} options={elementOptions}>
                                    <CheckoutForm providerReference={data.payment.providerReference} />
                                </Elements>
                            )}
                        </div>
                    </div>
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                        <h2 className="text-lg font-semibold text-slate-900">Items</h2>
                        <div className="mt-4 space-y-3 text-sm text-slate-600">
                            {data.order.items.map((item) => (
                                <div key={item.sku} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900">{item.name}</p>
                                        <p className="text-xs text-slate-400">
                                            {item.quantity} × {item.sku}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-slate-900">
                                        {formatter.format(item.line_total)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <aside className="space-y-6">
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                        <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
                        <div className="mt-4 space-y-3 text-sm text-slate-600">
                            <div className="flex items-center justify-between">
                                <span>Subtotal</span>
                                <span>{formatter.format(data.summary.subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Tax</span>
                                <span>{formatter.format(data.summary.tax)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Discount</span>
                                <span>-{formatter.format(data.summary.discount)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Shipping</span>
                                <span>{formatter.format(data.summary.shipping)}</span>
                            </div>
                            <div className="border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                                <div className="flex items-center justify-between">
                                    <span>Total due</span>
                                    <span>{formatter.format(data.summary.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </>
    );
}

