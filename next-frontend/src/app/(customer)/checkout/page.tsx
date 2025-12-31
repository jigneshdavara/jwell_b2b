'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { route } from '@/utils/route';
import { frontendService } from '@/services/frontendService';
import { Head } from '@/components/Head';

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
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <PaymentElement options={{ layout: 'tabs' }} />
            {error && <p className="text-xs text-rose-500 sm:text-sm">{error}</p>}
            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full rounded-full bg-elvee-blue px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy disabled:opacity-60 sm:px-5 sm:py-2 sm:text-sm"
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
                <div className="flex items-center justify-center py-12 sm:py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent sm:h-12 sm:w-12" />
                </div>
            </>
        );
    }

    if (error || !data) {
        return (
            <>
                <Head title="Checkout" />
                <div className="flex items-center justify-center py-12 sm:py-20">
                    <div className="text-center">
                        <p className="text-base font-semibold text-slate-900 sm:text-lg">{error || 'Failed to load checkout'}</p>
                        <Link href={route('frontend.cart.index')} className="mt-3 text-xs text-elvee-blue hover:underline sm:mt-4 sm:text-sm">
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
            <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-4 sm:space-y-6">
                    <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/80 sm:rounded-3xl sm:p-6">
                        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Secure payment</h1>
                        <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">Order reference <span className="font-semibold text-slate-900">{data.order.reference}</span></p>
                        <div className="mt-4 sm:mt-6">
                            {stripePromise && elementOptions && (
                                <Elements stripe={stripePromise} options={elementOptions}>
                                    <CheckoutForm providerReference={data.payment.providerReference} />
                                </Elements>
                            )}
                        </div>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/80 sm:rounded-3xl sm:p-6">
                        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Items</h2>
                        <div className="mt-3 space-y-2 text-xs text-slate-600 sm:mt-4 sm:space-y-3 sm:text-sm">
                            {data.order.items.map((item) => (
                                <div key={item.sku} className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1 pr-2">
                                        <p className="font-medium text-slate-900 truncate">{item.name}</p>
                                        <p className="text-[10px] text-slate-400 sm:text-xs">
                                            {item.quantity} × {item.sku}
                                        </p>
                                    </div>
                                    <p className="flex-shrink-0 font-semibold text-slate-900">
                                        {formatter.format(item.line_total)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <aside className="space-y-4 sm:space-y-6">
                    <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/80 sm:rounded-3xl sm:p-6">
                        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Summary</h2>
                        <div className="mt-3 space-y-2 text-xs text-slate-600 sm:mt-4 sm:space-y-3 sm:text-sm">
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
                            <div className="border-t border-slate-200 pt-2 text-sm font-semibold text-slate-900 sm:pt-3 sm:text-base">
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

