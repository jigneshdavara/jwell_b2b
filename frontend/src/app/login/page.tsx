'use client';

import Checkbox from '@/components/ui/Checkbox';
import InputError from '@/components/ui/InputError';
import InputLabel from '@/components/ui/InputLabel';
import TextInput from '@/components/ui/TextInput';
import PrimaryButton from '@/components/ui/PrimaryButton';
import GuestLayout from '@/components/shared/GuestLayout';
import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { route } from '@/utils/route';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { login, verifyOtp } from '@/store/slices/authSlice';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, otpLoginSchema, LoginFormData, OtpLoginFormData } from '@/lib/validation/auth.schema';
import { authService } from '@/services/authService';

type LoginMode = 'password' | 'otp';

export default function Login() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const [status, setStatus] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [otpRequestLoading, setOtpRequestLoading] = useState(false);
    const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);

    const [mode, setMode] = useState<LoginMode>('password');
    const [otpRequested, setOtpRequested] = useState(false);

    // Password login form with real-time validation
    const passwordForm = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: 'onSubmit', // Validate all fields on submit
        reValidateMode: 'onBlur', // Re-validate on blur after first validation
        shouldFocusError: true, // Automatically focus first error field on submit
        defaultValues: {
            email: '',
            password: '',
            remember: false,
        },
    });

    // OTP request form (email only)
    const otpRequestForm = useForm<{ email: string }>({
        resolver: zodResolver(otpLoginSchema.pick({ email: true })),
        mode: 'onSubmit', // Validate all fields on submit
        reValidateMode: 'onBlur', // Re-validate on blur after first validation
        shouldFocusError: true, // Automatically focus first error field on submit
        defaultValues: {
            email: '',
        },
    });

    // OTP verify form
    const otpVerifyForm = useForm<OtpLoginFormData>({
        resolver: zodResolver(otpLoginSchema),
        mode: 'onSubmit', // Validate all fields on submit
        reValidateMode: 'onBlur', // Re-validate on blur after first validation
        shouldFocusError: true, // Automatically focus first error field on submit
        defaultValues: {
            email: '',
            code: '',
        },
    });

    // Sync email between forms
    const syncEmail = (value: string) => {
        passwordForm.setValue('email', value);
        otpRequestForm.setValue('email', value);
        otpVerifyForm.setValue('email', value);
    };

    const sharedEmail = passwordForm.watch('email') || otpRequestForm.watch('email') || otpVerifyForm.watch('email');

    const submitPassword = async (data: LoginFormData) => {
        try {
            setLoading(true);
            const result = await dispatch(login(data)).unwrap();
            
            const user = result.user;
            const userType = (user?.type || '').toLowerCase();
            
            let redirectUrl: string;
            if (['admin', 'super-admin'].includes(userType)) {
                redirectUrl = route('admin.dashboard');
            } else if (userType === 'production') {
                redirectUrl = route('production.dashboard');
            } else {
                const kycStatus = user?.kyc_status || user?.kycStatus;
                if (kycStatus === 'approved') {
                    redirectUrl = route('dashboard');
                } else {
                    redirectUrl = '/onboarding/kyc';
                }
            }
            
            router.replace(redirectUrl);
        } catch (error: any) {
            // When using .unwrap(), Redux Toolkit passes the rejectWithValue payload directly
            // If authSlice uses rejectWithValue(errorMessage), error is the string message
            // If it's the full error object, extract from response.data.message
            
            let errorMessage: string;
            
            // Check if error is already a string (from rejectWithValue)
            if (typeof error === 'string') {
                errorMessage = error;
            } 
            // Check if it's the full error object with response.data
            else if (error?.response?.data?.errors && typeof error.response.data.errors === 'object') {
                // Handle field-level validation errors (400)
                Object.keys(error.response.data.errors).forEach((field) => {
                    const fieldErrors = error.response.data.errors[field];
                    const message = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
                    if (message) {
                        passwordForm.setError(field as keyof LoginFormData, {
                            type: 'server',
                            message: typeof message === 'string' ? message : String(message),
                        });
                    }
                });
                return; // Exit early, field errors handled
            } 
            // Extract from error object
            else {
                errorMessage = error?.response?.data?.message || 
                               (typeof error?.response?.data?.error === 'string' ? error.response.data.error : null) ||
                               error?.response?.data?.error?.[0]?.message || 
                               error?.message || 
                               'The user name or password is incorrect';
            }
            
            passwordForm.setError('root', {
                type: 'server',
                message: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    const submitOtpRequest = async (data: { email: string }) => {
        try {
            setOtpRequestLoading(true);
            setStatus(undefined);
            await authService.requestOtp(data.email);
            setOtpRequested(true);
            setStatus('A one-time code has been emailed.');
            otpVerifyForm.setValue('email', data.email);
        } catch (error: any) {
            // authService returns full error object (not Redux)
            // Prioritize message field from API response
            let errorMessage: string;
            
            if (error?.response?.data?.errors?.email) {
                // Handle field-level validation errors (400)
                const emailErrors = error.response.data.errors.email;
                const message = Array.isArray(emailErrors) ? emailErrors[0] : emailErrors;
                otpRequestForm.setError('email', {
                    type: 'server',
                    message: typeof message === 'string' ? message : String(message),
                });
                return; // Exit early, field error handled
            } else {
                // Extract error message - prioritize message field
                errorMessage = error?.response?.data?.message || 
                               (typeof error?.response?.data?.error === 'string' ? error.response.data.error : null) ||
                               error?.response?.data?.error?.[0]?.message || 
                               error?.message || 
                               'Failed to send code. Please try again.';
                otpRequestForm.setError('email', {
                    type: 'server',
                    message: errorMessage,
                });
            }
        } finally {
            setOtpRequestLoading(false);
        }
    };

    const submitOtpVerify = async (data: OtpLoginFormData) => {
        try {
            setOtpVerifyLoading(true);
            const result = await dispatch(verifyOtp({ email: data.email, code: data.code })).unwrap();
            
            const user = result.user;
            const userType = (user?.type || '').toLowerCase();
            
            let redirectUrl: string;
            if (['admin', 'super-admin'].includes(userType)) {
                redirectUrl = route('admin.dashboard');
            } else if (userType === 'production') {
                redirectUrl = route('production.dashboard');
            } else {
                const kycStatus = user?.kyc_status || user?.kycStatus;
                if (kycStatus === 'approved') {
                    redirectUrl = route('dashboard');
                } else {
                    redirectUrl = '/onboarding/kyc';
                }
            }
            
            router.replace(redirectUrl);
        } catch (error: any) {
            // When using .unwrap(), Redux Toolkit passes the rejectWithValue payload directly
            // If authSlice uses rejectWithValue(errorMessage), error is the string message
            // If it's the full error object, extract from response.data.message
            
            let errorMessage: string;
            
            // Check if error is already a string (from rejectWithValue)
            if (typeof error === 'string') {
                errorMessage = error;
            } 
            // Check if it's the full error object with response.data
            else if (error?.response?.data?.errors) {
                // Handle field-level validation errors (400)
                if (error.response.data.errors.code) {
                    const codeErrors = error.response.data.errors.code;
                    const message = Array.isArray(codeErrors) ? codeErrors[0] : codeErrors;
                    otpVerifyForm.setError('code', {
                        type: 'server',
                        message: typeof message === 'string' ? message : String(message),
                    });
                    return; // Exit early, field error handled
                } else if (error.response.data.errors.email) {
                    const emailErrors = error.response.data.errors.email;
                    const message = Array.isArray(emailErrors) ? emailErrors[0] : emailErrors;
                    otpVerifyForm.setError('email', {
                        type: 'server',
                        message: typeof message === 'string' ? message : String(message),
                    });
                    return; // Exit early, field error handled
                }
                // Fall through to extract general error
                errorMessage = error?.response?.data?.message || 
                               (typeof error?.response?.data?.error === 'string' ? error.response.data.error : null) ||
                               error?.response?.data?.error?.[0]?.message || 
                               error?.message || 
                               'Invalid code.';
            } 
            // Extract from error object
            else {
                errorMessage = error?.response?.data?.message || 
                               (typeof error?.response?.data?.error === 'string' ? error.response.data.error : null) ||
                               error?.response?.data?.error?.[0]?.message || 
                               error?.message || 
                               'Invalid code.';
            }
            
            otpVerifyForm.setError('code', {
                type: 'server',
                message: errorMessage,
            });
        } finally {
            setOtpVerifyLoading(false);
        }
    };

    const ArrowRightIcon = () => (
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 8h10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m9.5 4.5 3.5 3.5-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

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

    return (
        <GuestLayout>
            <div className="mx-auto grid w-full max-w-6xl items-start gap-6 px-1 sm:gap-8 sm:px-6 lg:grid-cols-[420px,minmax(0,1fr)] lg:gap-10 lg:px-10">
                <aside className="space-y-4 rounded-3xl bg-white/85 p-4 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10 backdrop-blur sm:space-y-6 sm:p-6 lg:p-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-feather-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-feather-gold sm:px-4 sm:text-xs">
                        Wholesale & retail access
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                        <h1 className="text-xl font-semibold text-elvee-blue sm:text-2xl lg:text-3xl">Welcome back to Elvee</h1>
                        <p className="text-xs text-ink/80 sm:text-sm">
                            Collaborate on pricing approvals, bullion locks, and production milestones with one elegant command center.
                        </p>
                    </div>
                    <ul className="space-y-3 sm:space-y-4">
                        {experienceHighlights.map((item) => (
                            <li key={item.title} className="flex gap-3 rounded-2xl border border-elvee-blue/10 bg-ivory/70 p-3 sm:gap-4 sm:p-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-feather-gold/40 bg-feather-gold/15 sm:h-10 sm:w-10">
                                    {item.icon}
                                </div>
                                <div className="space-y-1 text-xs text-ink/80 sm:text-sm">
                                    <p className="font-semibold text-ink">{item.title}</p>
                                    <p>{item.description}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {status && (
                        <div className="rounded-2xl border border-feather-gold/30 bg-feather-gold/10 px-3 py-2 text-xs font-medium text-ink sm:px-4 sm:py-3 sm:text-sm">
                            {status}
                        </div>
                    )}

                    <p className="text-xs text-ink/70 sm:text-sm">
                        New to Elvee?{' '}
                        <Link href={route('auth.register')} className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold">
                            Create an account
                        </Link>
                    </p>
                </aside>

                <div className="space-y-4">
                    <div className="rounded-3xl bg-white p-4 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10 sm:p-6 lg:p-8">
                        <header className="mb-4 space-y-2 sm:mb-6">
                            <div className="inline-flex items-center gap-2 rounded-full bg-ivory px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-elvee-blue sm:px-3 sm:text-[11px]">
                                Secure login
                            </div>
                            <h2 className="text-xl font-semibold text-elvee-blue sm:text-2xl">Access your Elvee workspace</h2>
                            <p className="text-xs text-ink/70 sm:text-sm">Choose your preferred authentication path - strong password or verified one-time passcode.</p>
                        </header>

                        <div className="mb-4 flex items-center justify-center rounded-full bg-ivory p-1 text-xs font-medium text-ink/60 sm:mb-6 sm:text-sm">
                            <button
                                type="button"
                                onClick={() => setMode('password')}
                                className={`flex-1 rounded-full px-3 py-1.5 transition sm:px-4 sm:py-2 ${
                                    mode === 'password' ? 'bg-elvee-blue text-white shadow-sm shadow-elvee-blue/40' : 'text-ink/70'
                                }`}
                            >
                                Password
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('otp')}
                                className={`flex-1 rounded-full px-3 py-1.5 transition sm:px-4 sm:py-2 ${
                                    mode === 'otp' ? 'bg-elvee-blue text-white shadow-sm shadow-elvee-blue/40' : 'text-ink/70'
                                }`}
                            >
                                Email OTP
                            </button>
                        </div>

                        {mode === 'password' ? (
                            <form onSubmit={passwordForm.handleSubmit(submitPassword)} className="space-y-4 sm:space-y-5">
                                <Controller
                                    name="email"
                                    control={passwordForm.control}
                                    render={({ field, fieldState }) => (
                                        <div>
                                            <InputLabel htmlFor="email" value="Email" />
                                            <TextInput
                                                id="email"
                                                type="email"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    syncEmail(e.target.value);
                                                }}
                                                className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                autoComplete="username"
                                                autoFocus
                                            />
                                            <InputError message={fieldState.error?.message} className="mt-2" />
                                        </div>
                                    )}
                                />

                                <Controller
                                    name="password"
                                    control={passwordForm.control}
                                    render={({ field, fieldState }) => (
                                        <div>
                                            <InputLabel htmlFor="password" value="Password" />
                                            <TextInput
                                                id="password"
                                                type="password"
                                                {...field}
                                                className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                autoComplete="current-password"
                                            />
                                            <InputError message={fieldState.error?.message} className="mt-2" />
                                        </div>
                                    )}
                                />

                                <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm">
                                    <Controller
                                        name="remember"
                                        control={passwordForm.control}
                                        render={({ field }) => (
                                            <label className="flex items-center gap-2 text-ink/70">
                                                <Checkbox
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                />
                                                <span>Remember me</span>
                                            </label>
                                        )}
                                    />
                                    <Link
                                        href={route('password.request')}
                                        className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                {passwordForm.formState.errors.root && (
                                    <div className="rounded-md bg-red-50 p-3">
                                        <p className="text-sm text-red-800">{passwordForm.formState.errors.root.message}</p>
                                    </div>
                                )}

                                <PrimaryButton 
                                    className="w-full gap-1.5 py-2 text-xs sm:gap-2 sm:py-2.5 sm:text-sm" 
                                    disabled={loading}
                                >
                                    <span>{loading ? 'Logging in...' : 'Log in'}</span>
                                    <ArrowRightIcon />
                                </PrimaryButton>
                            </form>
                        ) : (
                            <div className="space-y-4 sm:space-y-6">
                                <form onSubmit={otpRequestForm.handleSubmit(submitOtpRequest)} className="space-y-3 sm:space-y-4">
                                    {otpRequestForm.formState.errors.root && (
                                        <div className="mb-4 rounded-2xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 sm:px-4 sm:py-3 sm:text-sm">
                                            {otpRequestForm.formState.errors.root.message}
                                        </div>
                                    )}
                                    <Controller
                                        name="email"
                                        control={otpRequestForm.control}
                                        render={({ field, fieldState }) => (
                                            <div>
                                                <InputLabel htmlFor="otp_email" value="Email" />
                                                <TextInput
                                                    id="otp_email"
                                                    type="email"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        syncEmail(e.target.value);
                                                    }}
                                                    className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                    autoComplete="username"
                                                    autoFocus
                                                />
                                                <InputError message={fieldState.error?.message} className="mt-2" />
                                            </div>
                                        )}
                                    />
                                    <PrimaryButton 
                                        className="w-full gap-1.5 py-2 text-xs sm:gap-2 sm:py-2.5 sm:text-sm" 
                                        disabled={otpRequestLoading}
                                    >
                                        <span>{otpRequested ? 'Resend code' : 'Send login code'}</span>
                                        <ArrowRightIcon />
                                    </PrimaryButton>
                                </form>

                                <form onSubmit={otpVerifyForm.handleSubmit(submitOtpVerify)} className="space-y-3 sm:space-y-4">
                                    <Controller
                                        name="code"
                                        control={otpVerifyForm.control}
                                        render={({ field, fieldState }) => (
                                            <div>
                                                <InputLabel htmlFor="otp_code" value="One-time code" />
                                                <TextInput
                                                    id="otp_code"
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    {...field}
                                                    onChange={(e) => {
                                                        // Auto-format: only numbers, max 6 digits
                                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                        field.onChange(value);
                                                    }}
                                                    className={`mt-1 tracking-[0.5em] ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                    placeholder="------"
                                                />
                                                <InputError message={fieldState.error?.message} className="mt-2" />
                                            </div>
                                        )}
                                    />
                                    <PrimaryButton 
                                        className="w-full gap-1.5 py-2 text-xs sm:gap-2 sm:py-2.5 sm:text-sm" 
                                        disabled={otpVerifyLoading || !otpRequested}
                                    >
                                        <span>{otpVerifyLoading ? 'Verifying...' : 'Log in with code'}</span>
                                        <ArrowRightIcon />
                                    </PrimaryButton>
                                </form>
                            </div>
                        )}

                        <div className="mt-4 text-center text-xs text-ink/70 sm:mt-6 sm:text-sm">
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

                    <div className="rounded-2xl border border-dashed border-feather-gold/50 bg-feather-gold/5 px-4 py-3 text-center text-xs text-ink/80 sm:px-6 sm:py-4 sm:text-sm">
                        Need access for your retail or wholesale team?{' '}
                        <Link href={route('auth.register')} className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold">
                            Request onboarding
                        </Link>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
