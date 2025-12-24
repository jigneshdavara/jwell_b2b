'use client';

import InputError from '@/components/ui/InputError';
import InputLabel from '@/components/ui/InputLabel';
import PrimaryButton from '@/components/ui/PrimaryButton';
import TextInput from '@/components/ui/TextInput';
import { Transition } from '@headlessui/react';
import { useState, FormEventHandler, useRef } from 'react';
import { frontendService } from '@/services/frontendService';

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
    const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const updatePassword: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setFlashMessage(null);

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
            setFlashMessage({ type: 'success', message: 'Password updated successfully.' });
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
                    setFlashMessage({ type: 'error', message: errorMessage });
                } else if (typeof errorMessage === 'object') {
                    setErrors(errorMessage);
                }
            } else if (error.response?.data) {
                setErrors(error.response.data);
            } else {
                setFlashMessage({ type: 'error', message: 'Failed to update password. Please try again.' });
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
                <h2 className="text-lg font-medium text-gray-900">
                    Update Password
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Ensure your account is using a long, random password to stay
                    secure.
                </p>
            </header>

            {flashMessage && (
                <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                    flashMessage.type === 'success' 
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' 
                        : 'bg-rose-50 border border-rose-200 text-rose-900'
                }`}>
                    {flashMessage.message}
                </div>
            )}

            <form onSubmit={updatePassword} className="mt-6 space-y-6">
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
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                    />

                    <InputError
                        message={errors.current_password}
                        className="mt-2"
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
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                    />

                    <InputError message={errors.password} className="mt-2" />
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
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}

