'use client';

import DangerButton from '@/components/ui/DangerButton';
import InputError from '@/components/ui/InputError';
import InputLabel from '@/components/ui/InputLabel';
import Modal from '@/components/ui/Modal';
import SecondaryButton from '@/components/ui/SecondaryButton';
import TextInput from '@/components/ui/TextInput';
import { useState, FormEventHandler, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { frontendService } from '@/services/frontendService';
import { authService } from '@/services/authService';

export default function DeleteUserForm({
    className = '',
}: {
    className?: string;
}) {
    const router = useRouter();
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const [data, setData] = useState({
        password: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            await frontendService.deleteProfile(data.password);
            
            // Logout and redirect to home
            await authService.logout();
            router.push('/');
        } catch (error: any) {
            if (error.response?.data?.message) {
                const errorMessage = error.response.data.message;
                if (typeof errorMessage === 'string') {
                    setErrors({ password: errorMessage });
                } else if (typeof errorMessage === 'object') {
                    setErrors(errorMessage);
                }
            } else if (error.response?.data) {
                setErrors(error.response.data);
            } else {
                setErrors({ password: 'Failed to delete account. Please try again.' });
            }
            setProcessing(false);
        }
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        setData({ password: '' });
        setErrors({});
    };

    return (
        <section className={`space-y-4 sm:space-y-6 ${className}`}>
            <header>
                <h2 className="text-sm font-medium text-gray-900 sm:text-base lg:text-lg">
                    Delete Account
                </h2>

                <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                    Once your account is deleted, all of its resources and data
                    will be permanently deleted. Before deleting your account,
                    please download any data or information that you wish to
                    retain.
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion} className="w-full sm:w-auto">
                Delete Account
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-4 sm:p-6">
                    <h2 className="text-base font-medium text-gray-900 sm:text-lg">
                        Are you sure you want to delete your account?
                    </h2>

                    <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                        Once your account is deleted, all of its resources and
                        data will be permanently deleted. Please enter your
                        password to confirm you would like to permanently delete
                        your account.
                    </p>
                    <div className="mt-4 sm:mt-6">
                        <InputLabel
                            htmlFor="password"
                            value="Password"
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData({ ...data, password: e.target.value })
                            }
                            className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm sm:mt-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-base"
                            isFocused
                            placeholder="Password"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-1.5 sm:mt-2"
                        />
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3">
                        <SecondaryButton onClick={closeModal} className="w-full sm:w-auto order-2 sm:order-1">
                            Cancel
                        </SecondaryButton>

                        <DangerButton className="w-full sm:w-auto order-1 sm:order-2 sm:ms-3" disabled={processing}>
                            Delete Account
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}

