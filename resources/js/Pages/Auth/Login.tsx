import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type LoginMode = 'password' | 'otp';

type PasswordFormData = {
    email: string;
    password: string;
    remember: boolean;
};

type OtpRequestFormData = {
    email: string;
};

type OtpVerifyFormData = {
    email: string;
    code: string;
};

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const [mode, setMode] = useState<LoginMode>('password');
    const [otpRequested, setOtpRequested] = useState(false);

    const passwordForm = useForm<PasswordFormData>({
        email: '',
        password: '',
        remember: false,
    });

    const otpRequestForm = useForm<OtpRequestFormData>({
        email: '',
    });

    const otpVerifyForm = useForm<OtpVerifyFormData>({
        email: '',
        code: '',
    });

    const syncEmail = (value: string) => {
        passwordForm.setData('email', value);
        otpRequestForm.setData('email', value);
        otpVerifyForm.setData('email', value);
    };

    const sharedEmail = passwordForm.data.email;

    const submitPassword: FormEventHandler = (event) => {
        event.preventDefault();

        passwordForm.post(route('login'), {
            onFinish: () => passwordForm.reset('password'),
        });
    };

    const submitOtpRequest: FormEventHandler = (event) => {
        event.preventDefault();
        otpRequestForm.post(route('login.otp.send'), {
            onSuccess: () => setOtpRequested(true),
        });
    };

    const submitOtpVerify: FormEventHandler = (event) => {
        event.preventDefault();
        otpVerifyForm.post(route('login.otp.verify'));
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr),400px] lg:items-start">
                <aside className="space-y-6 text-slate-200">
                    <h1 className="text-3xl font-semibold text-white">Welcome back to Elvee</h1>
                    <p className="text-sm text-slate-300">
                        Sign in to manage partnership pricing, monitor jobwork milestones, and keep wholesale orders moving in one place.
                    </p>
                    <ul className="space-y-3 text-sm text-slate-200">
                        <li className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/80 text-xs font-semibold text-white">
                                ✓
                            </span>
                            <span>Track catalogue enquiries and approved pricing in real time.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/80 text-xs font-semibold text-white">
                                ✓
                            </span>
                            <span>Submit and monitor jobwork requests with production updates.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/80 text-xs font-semibold text-white">
                                ✓
                            </span>
                            <span>Access exclusive offers, metal rates, and credit limits.</span>
                        </li>
                    </ul>

                    {status && (
                        <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
                            {status}
                        </div>
                    )}

                    <p className="text-sm text-slate-300">
                        New to Elvee?{' '}
                        <Link href={route('register')} className="font-semibold text-white underline decoration-slate-400 hover:decoration-white">
                            Create an account
                        </Link>
                    </p>
                </aside>

                <div className="space-y-6">
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                        <header className="mb-6 space-y-1">
                            <h2 className="text-2xl font-semibold text-slate-900">Sign in to your account</h2>
                            <p className="text-sm text-slate-500">
                                Use your password or request a one-time code via email.
                            </p>
                        </header>

                        {mode === 'password' ? (
                            <form onSubmit={submitPassword} className="space-y-5">
                                <div>
                                    <InputLabel htmlFor="email" value="Email" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={sharedEmail}
                                        className="mt-1 block w-full"
                                        autoComplete="username"
                                        isFocused={true}
                                        onChange={(event) => syncEmail(event.target.value)}
                                    />
                                    <InputError message={passwordForm.errors.email} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password" value="Password" />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={passwordForm.data.password}
                                        className="mt-1 block w-full"
                                        autoComplete="current-password"
                                        onChange={(event) => passwordForm.setData('password', event.target.value)}
                                    />
                                    <InputError message={passwordForm.errors.password} className="mt-2" />
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <label className="flex items-center gap-2 text-slate-600">
                                        <Checkbox
                                            name="remember"
                                            checked={passwordForm.data.remember}
                                            onChange={(event) => passwordForm.setData('remember', event.target.checked)}
                                        />
                                        <span>Remember me</span>
                                    </label>
                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-slate-600 underline hover:text-slate-800"
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>

                                <PrimaryButton className="w-full" disabled={passwordForm.processing}>
                                    Log in
                                </PrimaryButton>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <form onSubmit={submitOtpRequest} className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="otp_email" value="Email" />
                                        <TextInput
                                            id="otp_email"
                                            type="email"
                                            name="email"
                                            value={sharedEmail}
                                            className="mt-1 block w-full"
                                            autoComplete="username"
                                            isFocused={true}
                                            onChange={(event) => syncEmail(event.target.value)}
                                        />
                                        <InputError message={otpRequestForm.errors.email} className="mt-2" />
                                    </div>
                                    <PrimaryButton className="w-full" disabled={otpRequestForm.processing}>
                                        {otpRequested ? 'Resend code' : 'Send login code'}
                                    </PrimaryButton>
                                </form>

                                <form onSubmit={submitOtpVerify} className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="otp_code" value="One-time code" />
                                        <TextInput
                                            id="otp_code"
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            name="code"
                                            value={otpVerifyForm.data.code}
                                            className="mt-1 block w-full tracking-[0.5em]"
                                            placeholder="------"
                                            onChange={(event) => otpVerifyForm.setData('code', event.target.value)}
                                        />
                                        <InputError message={otpVerifyForm.errors.code} className="mt-2" />
                                    </div>
                                    <PrimaryButton className="w-full" disabled={otpVerifyForm.processing || !otpRequested}>
                                        Log in with code
                                    </PrimaryButton>
                                </form>
                            </div>
                        )}

                        <div className="mt-6 text-center text-sm text-slate-500">
                            {mode === 'password' ? (
                                <button
                                    type="button"
                                    onClick={() => setMode('otp')}
                                    className="font-semibold text-slate-700 underline hover:text-slate-900"
                                >
                                    Prefer email OTP? Get a code instead
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setMode('password')}
                                    className="font-semibold text-slate-700 underline hover:text-slate-900"
                                >
                                    Back to password login
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="text-center text-sm text-slate-500">
                        Need an account?{' '}
                        <Link href={route('register')} className="font-semibold text-slate-700 underline hover:text-slate-900">
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
