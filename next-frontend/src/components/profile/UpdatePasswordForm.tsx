'use client';

import InputError from '@/components/ui/InputError';
import InputLabel from '@/components/ui/InputLabel';
import PrimaryButton from '@/components/ui/PrimaryButton';
import TextInput from '@/components/ui/TextInput';
import { Transition } from '@headlessui/react';
import { useState, FormEventHandler, useRef } from 'react';
import { frontendService } from '@/services/frontendService';
import { toastError } from '@/utils/toast';

export default function UpdatePasswordForm({
    className = '',
}: {
    className?: string;
}) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const [data, setData] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);
    // Toast notifications are handled via RTK

    const updatePassword: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // Validate password confirmation
        if (data.password !== data.password_confirmation) {
            setErrors({ password_confirmation: 'Passwords do not match' });
            setProcessing(false);
            return;
        }

        try {
            await frontendService.updatePassword({
                current_password: data.current_password,
                password: data.password,
                password_confirmation: data.password_confirmation,
            });

            setRecentlySuccessful(true);
            setData({
                current_password: '',
                password: '',
                password_confirmation: '',
            });
            setTimeout(() => setRecentlySuccessful(false), 2000);
        } catch (error: any) {
            if (error.response?.data?.message) {
                const errorMessage = error.response.data.message;
                if (typeof errorMessage === 'string') {
                    toastError(errorMessage);
                } else if (typeof errorMessage === 'object') {
                    setErrors(errorMessage);
                }
            } else if (error.response?.data) {
                setErrors(error.response.data);
            } else {
                toastError('Failed to update password. Please try again.');
            }

            // Focus on the appropriate input based on error
            if (errors.password) {
                passwordInput.current?.focus();
            }
            if (errors.current_password) {
                currentPasswordInput.current?.focus();
            }
        } finally {
            setProcessing(false);
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


            <form onSubmit={updatePassword} className="mt-4 space-y-4 sm:mt-6 sm:space-y-6">
                <div>
                    <InputLabel
                        htmlFor="current_password"
                        value="Current Password"
                    />

                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) =>
                            setData({ ...data, current_password: e.target.value })
                        }
                        type="password"
                        className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm sm:mt-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-base"
                        autoComplete="current-password"
                    />

                    <InputError
                        message={errors.current_password}
                        className="mt-1.5 sm:mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="New Password" />

                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData({ ...data, password: e.target.value })}
                        type="password"
                        className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm sm:mt-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-base"
                        autoComplete="new-password"
                    />

                    <InputError message={errors.password} className="mt-1.5 sm:mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />

                    <TextInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData({ ...data, password_confirmation: e.target.value })
                        }
                        type="password"
                        className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm sm:mt-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-base"
                        autoComplete="new-password"
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-1.5 sm:mt-2"
                    />
                </div>

                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <PrimaryButton disabled={processing} className="w-full sm:w-auto">Save</PrimaryButton>

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

