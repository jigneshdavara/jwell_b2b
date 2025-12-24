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
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Delete Account
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Once your account is deleted, all of its resources and data
                    will be permanently deleted. Before deleting your account,
                    please download any data or information that you wish to
                    retain.
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion}>
                Delete Account
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Are you sure you want to delete your account?
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        Once your account is deleted, all of its resources and
                        data will be permanently deleted. Please enter your
                        password to confirm you would like to permanently delete
                        your account.
                    </p>
                    <div className="mt-6">
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
                            className="mt-1 block w-3/4"
                            isFocused
                            placeholder="Password"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>
                            Cancel
                        </SecondaryButton>

                        <DangerButton className="ms-3" disabled={processing}>
                            Delete Account
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}

