'use client';

import InputError from '@/components/ui/InputError';
import InputLabel from '@/components/ui/InputLabel';
import PrimaryButton from '@/components/ui/PrimaryButton';
import TextInput from '@/components/ui/TextInput';
import { Transition } from '@headlessui/react';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileUpdateSchema, type ProfileUpdateFormData } from '@/lib/validation/auth.schema';
import { frontendService } from '@/services/frontendService';
import { authService } from '@/services/authService';
import { useRouter } from 'next/navigation';
import { toastError } from '@/utils/toast';

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
    const router = useRouter();
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<string>('');
    const [sendingVerification, setSendingVerification] = useState(false);

    // React Hook Form setup
    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setError,
    } = useForm<ProfileUpdateFormData>({
        resolver: zodResolver(profileUpdateSchema),
        mode: 'onSubmit',
        reValidateMode: 'onBlur',
        shouldFocusError: true,
        defaultValues: {
            name: user?.name ?? '',
            email: user?.email ?? '',
            phone: user?.phone ?? null,
            preferred_language: (user?.preferred_language ?? 'en') as 'en' | 'hi' | 'gu',
        },
    });

    // Update form data when user changes
    useEffect(() => {
        if (user) {
            reset({
                name: user.name ?? '',
                email: user.email ?? '',
                phone: user.phone ?? null,
                preferred_language: (user.preferred_language ?? 'en') as 'en' | 'hi' | 'gu',
            });
        }
    }, [user, reset]);

    const submit = async (formData: ProfileUpdateFormData) => {
        try {
            await frontendService.updateProfile({
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                preferred_language: formData.preferred_language || undefined,
            });

            setRecentlySuccessful(true);
            setTimeout(() => setRecentlySuccessful(false), 2000);
            
            // Refresh the page to get updated user data
            router.refresh();
        } catch (error: any) {
            if (error.response?.data?.errors) {
                // Set errors using React Hook Form's setError
                for (const key in error.response.data.errors) {
                    setError(key as keyof ProfileUpdateFormData, {
                        type: 'server',
                        message: error.response.data.errors[key][0],
                    });
                }
            } else if (error.response?.data?.message) {
                const errorMessage = error.response.data.message;
                if (typeof errorMessage === 'string') {
                    toastError(errorMessage);
                }
            } else {
                toastError('Failed to update profile. Please try again.');
            }
        }
    };

    const handleResendVerification = async () => {
        if (!user?.email) return;
        
        setSendingVerification(true);
        setVerificationStatus('');
        
        try {
            await authService.resendVerification(user.email);
            setVerificationStatus('verification-link-sent');
        } catch (error: any) {
            // Still show success message for security (don't reveal if email exists)
            setVerificationStatus('verification-link-sent');
        } finally {
            setSendingVerification(false);
        }
    };

    return (
        <section className={className}>
            <header className="flex flex-col gap-1.5 sm:gap-2">
                <h2 className="text-base font-semibold text-slate-900 sm:text-lg lg:text-xl">
                    Partner contact details
                </h2>

                <p className="text-xs text-slate-500 sm:text-sm">
                    Keep your storefront information current so our operations team can connect instantly when orders
                    move through production.
                </p>
            </header>


            <form onSubmit={handleSubmit(submit)} className="mt-4 space-y-4 sm:mt-6 sm:space-y-6">
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="name" value="Full name" />

                        <Controller
                            name="name"
                            control={control}
                            render={({ field, fieldState }) => (
                                <>
                                    <TextInput
                                        {...field}
                                        id="name"
                                        className={`mt-1.5 block w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 sm:mt-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-base ${
                                            fieldState.error || errors.name ? 'border-red-300 focus:border-red-400 focus:ring-red-300' : 'border-slate-200 focus:border-sky-400 focus:ring-sky-200'
                                        }`}
                                        autoComplete="name"
                                    />
                                    <InputError className="mt-1.5 sm:mt-2" message={errors.name?.message} />
                                </>
                            )}
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="phone" value="Contact number" />

                        <Controller
                            name="phone"
                            control={control}
                            render={({ field, fieldState }) => (
                                <>
                                    <TextInput
                                        {...field}
                                        id="phone"
                                        value={field.value ?? ''}
                                        onChange={(e) => field.onChange(e.target.value || null)}
                                        className={`mt-1.5 block w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 sm:mt-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-base ${
                                            fieldState.error || errors.phone ? 'border-red-300 focus:border-red-400 focus:ring-red-300' : 'border-slate-200 focus:border-sky-400 focus:ring-sky-200'
                                        }`}
                                        autoComplete="tel"
                                        placeholder="e.g. +91 98765 43210"
                                    />
                                    <InputError className="mt-1.5 sm:mt-2" message={errors.phone?.message} />
                                </>
                            )}
                        />
                    </div>
                </div>

                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="email" value="Work email" />

                        <Controller
                            name="email"
                            control={control}
                            render={({ field, fieldState }) => (
                                <>
                                    <TextInput
                                        {...field}
                                        id="email"
                                        type="email"
                                        className={`mt-1.5 block w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 sm:mt-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-base ${
                                            fieldState.error || errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-300' : 'border-slate-200 focus:border-sky-400 focus:ring-sky-200'
                                        }`}
                                        autoComplete="username"
                                    />
                                    <InputError className="mt-1.5 sm:mt-2" message={errors.email?.message} />
                                </>
                            )}
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="preferred_language" value="Preferred language" />

                        <Controller
                            name="preferred_language"
                            control={control}
                            render={({ field, fieldState }) => (
                                <>
                                    <select
                                        {...field}
                                        id="preferred_language"
                                        className={`mt-1.5 block w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 sm:mt-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-base ${
                                            fieldState.error || errors.preferred_language ? 'border-red-300 focus:border-red-400 focus:ring-red-300' : 'border-slate-200 focus:border-sky-400 focus:ring-sky-200'
                                        }`}
                                    >
                                        {languageOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError className="mt-1.5 sm:mt-2" message={errors.preferred_language?.message} />
                                </>
                            )}
                        />
                    </div>
                </div>

                {mustVerifyEmail && user?.email_verified_at === null && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                        <p>
                            Your email address is unverified.{' '}
                            <button
                                type="button"
                                onClick={handleResendVerification}
                                disabled={sendingVerification}
                                className="font-semibold text-amber-900 underline decoration-dashed hover:text-amber-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sendingVerification ? 'Sending...' : 'Click here to re-send the verification email.'}
                            </button>
                        </p>

                        {(status === 'verification-link-sent' || verificationStatus === 'verification-link-sent') && (
                            <div className="mt-1.5 text-xs font-semibold sm:mt-2 sm:text-sm">A new verification link has been sent to your inbox.</div>
                        )}
                    </div>
                )}

                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <PrimaryButton disabled={isSubmitting} className="w-full sm:w-auto">Save updates</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-xs text-slate-500 sm:text-sm">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}

