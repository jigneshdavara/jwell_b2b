import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, ReactNode, useState } from 'react';

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
    const experienceHighlights: Array<{ title: string; description: string; icon: ReactNode }> = [
        {
            title: 'Wholesale cockpit',
            description: 'Track catalogue enquiries, allocations, and approvals in real time.',
            icon: (
                <svg
                    className="h-5 w-5 text-feather-gold"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M4 7h16" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M5 20h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1Z" />
                </svg>
            ),
        },
        {
            title: 'Jobwork monitor',
            description: 'Submit production briefs and receive milestone alerts instantly.',
            icon: (
                <svg
                    className="h-5 w-5 text-feather-gold"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 2v4" />
                    <path d="m16.2 7.8 2.8-2.8" />
                    <path d="M20 12h4" />
                    <path d="m16.2 16.2 2.8 2.8" />
                    <path d="M12 18v4" />
                    <path d="m5 5 2.8 2.8" />
                    <path d="M2 12h4" />
                    <path d="m5 19 2.8-2.8" />
                    <circle cx="12" cy="12" r="3.5" />
                </svg>
            ),
        },
        {
            title: 'Rates & offers',
            description: 'Access locked bullion rates, metal credits, and retailer-specific offers.',
            icon: (
                <svg
                    className="h-5 w-5 text-feather-gold"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 1v22" />
                    <path d="M17 5H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H7" />
                </svg>
            ),
        },
    ];

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

            <div className="mx-auto grid w-full max-w-6xl items-start gap-10 lg:grid-cols-[360px,minmax(0,1fr)]">
                <aside className="space-y-6 rounded-3xl bg-white/85 p-8 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10 backdrop-blur">
                    <div className="inline-flex items-center gap-2 rounded-full bg-feather-gold/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-feather-gold">
                        Wholesale & retail access
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-semibold text-elvee-blue">Welcome back to Elvee</h1>
                        <p className="text-sm text-ink/80">
                            Collaborate on pricing approvals, bullion locks, and production milestones with one elegant command center.
                        </p>
                    </div>
                    <ul className="space-y-4">
                        {experienceHighlights.map((item) => (
                            <li key={item.title} className="flex gap-4 rounded-2xl border border-elvee-blue/10 bg-ivory/70 p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-feather-gold/15">
                                    {item.icon}
                                </div>
                                <div className="space-y-1 text-sm text-ink/80">
                                    <p className="font-semibold text-ink">{item.title}</p>
                                    <p>{item.description}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {status && (
                        <div className="rounded-2xl border border-feather-gold/30 bg-feather-gold/10 px-4 py-3 text-sm font-medium text-ink">
                            {status}
                        </div>
                    )}

                    <p className="text-sm text-ink/70">
                        New to Elvee?{' '}
                        <Link href={route('register')} className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold">
                            Create an account
                        </Link>
                    </p>
                </aside>

                <div className="space-y-4">
                    <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10">
                        <header className="mb-6 space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full bg-ivory px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-elvee-blue">
                                Secure login
                            </div>
                            <h2 className="text-2xl font-semibold text-elvee-blue">Access your Elvee workspace</h2>
                            <p className="text-sm text-ink/70">Choose your preferred authentication path - strong password or verified one-time passcode.</p>
                        </header>

                        <div className="mb-6 flex items-center justify-center rounded-full bg-ivory p-1 text-sm font-medium text-ink/60">
                            <button
                                type="button"
                                onClick={() => setMode('password')}
                                className={`flex-1 rounded-full px-4 py-2 transition ${
                                    mode === 'password' ? 'bg-elvee-blue text-white shadow-sm shadow-elvee-blue/40' : 'text-ink/70'
                                }`}
                            >
                                Password
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('otp')}
                                className={`flex-1 rounded-full px-4 py-2 transition ${
                                    mode === 'otp' ? 'bg-elvee-blue text-white shadow-sm shadow-elvee-blue/40' : 'text-ink/70'
                                }`}
                            >
                                Email OTP
                            </button>
                        </div>

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
                                    <label className="flex items-center gap-2 text-ink/70">
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
                                            className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold"
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

                        <div className="mt-6 text-center text-sm text-ink/70">
                            {mode === 'password' ? (
                                <button
                                    type="button"
                                    onClick={() => setMode('otp')}
                                    className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold"
                                >
                                    Prefer email OTP? Get a code instead
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setMode('password')}
                                    className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold"
                                >
                                    Back to password login
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-dashed border-feather-gold/50 bg-feather-gold/5 px-6 py-4 text-center text-sm text-ink/80">
                        Need access for your retail or wholesale team?{' '}
                        <Link href={route('register')} className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold">
                            Request onboarding
                        </Link>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
