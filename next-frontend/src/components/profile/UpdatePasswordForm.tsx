'use client';

import InputError from '@/components/ui/InputError';
import InputLabel from '@/components/ui/InputLabel';
import PrimaryButton from '@/components/ui/PrimaryButton';
import TextInput from '@/components/ui/TextInput';
import { Transition } from '@headlessui/react';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updatePasswordSchema, type UpdatePasswordFormData } from '@/lib/validation/auth.schema';
import { frontendService } from '@/services/frontendService';
import { toastError } from '@/utils/toast';

export default function UpdatePasswordForm({
    className = '',
}: {
    className?: string;
}) {
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);

    // React Hook Form setup
    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setError,
    } = useForm<UpdatePasswordFormData>({
        resolver: zodResolver(updatePasswordSchema),
        mode: 'onSubmit',
        reValidateMode: 'onBlur',
        shouldFocusError: true,
        defaultValues: {
            current_password: '',
            password: '',
            password_confirmation: '',
        },
    });

    const updatePassword = async (formData: UpdatePasswordFormData) => {
        try {
            await frontendService.updatePassword({
                current_password: formData.current_password,
                password: formData.password,
                password_confirmation: formData.password_confirmation,
            });

            setRecentlySuccessful(true);
            reset();
            setTimeout(() => setRecentlySuccessful(false), 2000);
        } catch (error: any) {
            if (error.response?.data?.errors) {
                // Set errors using React Hook Form's setError
                for (const key in error.response.data.errors) {
                    setError(key as keyof UpdatePasswordFormData, {
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
                toastError('Failed to update password. Please try again.');
            }
        }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-base font-medium text-gray-900 sm:text-lg">
                    Update Password
                </h2>

                <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                    Ensure your account is using a long, random password to stay
                    secure.
                </p>
            </header>


            <form onSubmit={handleSubmit(updatePassword)} className="mt-4 space-y-4 sm:mt-6 sm:space-y-6">
                <div>
                    <InputLabel
                        htmlFor="current_password"
                        value="Current Password"
                    />

                    <Controller
                        name="current_password"
                        control={control}
                        render={({ field, fieldState }) => (
                            <>
                                <TextInput
                                    {...field}
                                    id="current_password"
                                    type="password"
                                    className={`mt-1.5 block w-full rounded-xl border bg-white px-3 py-2 text-sm sm:mt-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-base ${
                                        fieldState.error || errors.current_password ? 'border-red-300 focus:border-red-400 focus:ring-red-300' : 'border-slate-200 focus:border-sky-400 focus:ring-sky-200'
                                    }`}
                                    autoComplete="current-password"
                                />
                                <InputError
                                    message={errors.current_password?.message}
                                    className="mt-1.5 sm:mt-2"
                                />
                            </>
                        )}
                    />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="New Password" />

                    <Controller
                        name="password"
                        control={control}
                        render={({ field, fieldState }) => (
                            <>
                                <TextInput
                                    {...field}
                                    id="password"
                                    type="password"
                                    className={`mt-1.5 block w-full rounded-xl border bg-white px-3 py-2 text-sm sm:mt-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-base ${
                                        fieldState.error || errors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-300' : 'border-slate-200 focus:border-sky-400 focus:ring-sky-200'
                                    }`}
                                    autoComplete="new-password"
                                />
                                <InputError message={errors.password?.message} className="mt-1.5 sm:mt-2" />
                            </>
                        )}
                    />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />

                    <Controller
                        name="password_confirmation"
                        control={control}
                        render={({ field, fieldState }) => (
                            <>
                                <TextInput
                                    {...field}
                                    id="password_confirmation"
                                    type="password"
                                    className={`mt-1.5 block w-full rounded-xl border bg-white px-3 py-2 text-sm sm:mt-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-base ${
                                        fieldState.error || errors.password_confirmation ? 'border-red-300 focus:border-red-400 focus:ring-red-300' : 'border-slate-200 focus:border-sky-400 focus:ring-sky-200'
                                    }`}
                                    autoComplete="new-password"
                                />
                                <InputError
                                    message={errors.password_confirmation?.message}
                                    className="mt-1.5 sm:mt-2"
                                />
                            </>
                        )}
                    />
                </div>

                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <PrimaryButton disabled={isSubmitting} className="w-full sm:w-auto">Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-xs text-gray-600 sm:text-sm">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}

