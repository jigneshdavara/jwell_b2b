'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { route } from '@/utils/route';
import { frontendService } from '@/services/frontendService';
import AuthenticatedLayout from '@/components/shared/AuthenticatedLayout';
import FlashMessage from '@/components/shared/FlashMessage';

type CheckoutData = {
    order: {
        reference: string;
        total: number;
        currency: string;
        items: Array<{
            sku: string;
            name: string;
            quantity: number;
            line_total: number;
        }>;
    };
    payment: {
        publishableKey: string;
        clientSecret: string;
        paymentId?: string;
        providerReference: string;
    };
    summary: {
        subtotal: number;
        tax: number;
        discount: number;
        shipping: number;
        total: number;
        currency: string;
    };
};

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
            await frontendService.confirmCheckout(paymentIntentId);
            router.push(route('frontend.orders.index'));
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
                        publishableKey: response.data.payment.publishableKey,
                        clientSecret: response.data.payment.clientSecret,
                        paymentId: response.data.payment.paymentId,
                        providerReference: response.data.payment.providerReference,
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
            <AuthenticatedLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
                </div>
            </AuthenticatedLayout>
        );
    }

    if (error || !data) {
        return (
            <AuthenticatedLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <p className="text-lg font-semibold text-slate-900">{error || 'Failed to load checkout'}</p>
                        <Link href={route('frontend.cart.index')} className="mt-4 text-sm text-elvee-blue hover:underline">
                            Back to cart
                        </Link>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
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
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80 space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900">Items</h2>
                        {data.order.items.map((item) => (
                            <div key={item.sku} className="flex justify-between text-sm">
                                <div><p className="font-medium">{item.name}</p><p className="text-xs text-slate-400">{item.quantity} × {item.sku}</p></div>
                                <p className="font-semibold">{formatter.format(item.line_total)}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <aside className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80 h-fit space-y-4 text-sm">
                    <h2 className="text-lg font-semibold">Summary</h2>
                    <div className="flex justify-between"><span>Subtotal</span><span>{formatter.format(data.summary.subtotal)}</span></div>
                    <div className="flex justify-between border-t pt-3 font-semibold text-base"><span>Total due</span><span>{formatter.format(data.summary.total)}</span></div>
                </aside>
            </div>
        </AuthenticatedLayout>
    );
}

