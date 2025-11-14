import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { FormEvent, useMemo, useState } from 'react';

type CheckoutPageProps = PageProps<{
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
}>;

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

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!stripe || !elements) {
            return;
        }

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

        router.post(
            route('frontend.checkout.confirm'),
            { payment_intent_id: paymentIntentId },
            {
                onError: (errors) => {
                    setProcessing(false);
                    setError(errors.payment as string);
                },
            },
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement options={{ layout: 'tabs' }} />
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full rounded-full bg-elvee-blue px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60"
            >
                {processing ? 'Processing…' : 'Confirm payment'}
            </button>
        </form>
    );
}

export default function CheckoutIndex() {
    const { order, payment, summary } = usePage<CheckoutPageProps>().props;
    const formatter = useMemo(() => currencyFormatter(order.currency), [order.currency]);

    const stripePromise = useMemo(() => loadStripe(payment.publishableKey), [payment.publishableKey]);

    const elementOptions: StripeElementsOptions = useMemo(
        () => ({
            clientSecret: payment.clientSecret,
            appearance: {
                theme: 'stripe',
            },
        }),
        [payment.clientSecret],
    );

    return (
        <AuthenticatedLayout>
            <Head title="Checkout" />

            <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                        <h1 className="text-2xl font-semibold text-slate-900">Secure payment</h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Order reference <span className="font-semibold text-slate-900">{order.reference}</span>
                        </p>
                        <div className="mt-6">
                            <Elements stripe={stripePromise} options={elementOptions}>
                                <CheckoutForm providerReference={payment.providerReference} />
                            </Elements>
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                        <h2 className="text-lg font-semibold text-slate-900">Items</h2>
                        <div className="mt-4 space-y-3 text-sm text-slate-600">
                            {order.items.map((item) => (
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
                                <span>{formatter.format(summary.subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Tax</span>
                                <span>{formatter.format(summary.tax)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Discount</span>
                                <span>-{formatter.format(summary.discount)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Shipping</span>
                                <span>{formatter.format(summary.shipping)}</span>
                            </div>
                            <div className="border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                                <div className="flex items-center justify-between">
                                    <span>Total due</span>
                                    <span>{formatter.format(summary.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </AuthenticatedLayout>
    );
}
