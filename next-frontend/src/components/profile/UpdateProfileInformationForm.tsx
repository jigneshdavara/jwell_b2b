'use client';

import InputError from '@/components/ui/InputError';
import InputLabel from '@/components/ui/InputLabel';
import PrimaryButton from '@/components/ui/PrimaryButton';
import TextInput from '@/components/ui/TextInput';
import { Transition } from '@headlessui/react';
import { useState, FormEventHandler } from 'react';

const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi' },
    { value: 'gu', label: 'Gujarati' },
];

export default function UpdateProfileInformationForm({
    user,
    mustVerifyEmail,
    status,
    className = '',
}: {
    user: any;
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const [data, setData] = useState({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        preferred_language: user?.preferred_language ?? 'en',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // Mock update logic
        setTimeout(() => {
            setRecentlySuccessful(true);
            setProcessing(false);
            setTimeout(() => setRecentlySuccessful(false), 2000);
        }, 1000);
    };

    return (
        <section className={className}>
            <header className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold text-slate-900">
                    Partner contact details
                </h2>

                <p className="text-sm text-slate-500">
                    Keep your storefront information current so our operations team can connect instantly when orders
                    move through production.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="name" value="Full name" />

                        <TextInput
                            id="name"
                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            value={data.name}
                            onChange={(e) => setData({ ...data, name: e.target.value })}
                            required
                            isFocused
                            autoComplete="name"
                        />

                        <InputError className="mt-2" message={errors.name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="phone" value="Contact number" />

                        <TextInput
                            id="phone"
                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            value={data.phone}
                            onChange={(e) => setData({ ...data, phone: e.target.value })}
                            autoComplete="tel"
                            placeholder="e.g. +91 98765 43210"
                        />

                        <InputError className="mt-2" message={errors.phone} />
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="email" value="Work email" />

                        <TextInput
                            id="email"
                            type="email"
                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            value={data.email}
                            onChange={(e) => setData({ ...data, email: e.target.value })}
                            required
                            autoComplete="username"
                        />

                        <InputError className="mt-2" message={errors.email} />
                    </div>

                    <div>
                        <InputLabel htmlFor="preferred_language" value="Preferred language" />

                        <select
                            id="preferred_language"
                            value={data.preferred_language}
                            onChange={(event) => setData({ ...data, preferred_language: event.target.value })}
                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        >
                            {languageOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <InputError className="mt-2" message={errors.preferred_language} />
                    </div>
                </div>

                {mustVerifyEmail && user?.email_verified_at === null && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        <p>
                            Your email address is unverified.{' '}
                            <button
                                type="button"
                                className="font-semibold text-amber-900 underline decoration-dashed"
                            >
                                Click here to re-send the verification email.
                            </button>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 font-semibold">A new verification link has been sent to your inbox.</div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save updates</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-slate-500">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}

