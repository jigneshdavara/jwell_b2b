import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

const accountTypes = [
    { value: 'retailer', label: 'Retailer' },
    { value: 'wholesaler', label: 'Wholesaler' },
];

const steps = [
    {
        title: 'Account setup',
        description: 'Who is signing up and how they will log in.',
    },
    {
        title: 'Business verification',
        description: 'Share credentials so we can validate your jewellery practice.',
    },
    {
        title: 'Registered address',
        description: 'Tell us where to ship and how to contact your team.',
    },
];

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        account_type: 'retailer',
        business_name: '',
        gst_number: '',
        pan_number: '',
        registration_number: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India',
        website: '',
        contact_name: '',
        contact_phone: '',
    });

    const [currentStep, setCurrentStep] = useState(0);

    const isLastStep = currentStep === steps.length - 1;

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (!isLastStep) {
            setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
            return;
        }

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const goToStep = (step: number) => {
        setCurrentStep(Math.max(0, Math.min(step, steps.length - 1)));
    };

    const renderAccountStep = () => (
        <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
                <div>
                    <InputLabel htmlFor="name" value="Full name" />
                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(event) => setData('name', event.target.value)}
                        required
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="phone" value="Phone" />
                    <TextInput
                        id="phone"
                        name="phone"
                        value={data.phone}
                        className="mt-1 block w-full"
                        autoComplete="tel"
                        onChange={(event) => setData('phone', event.target.value)}
                        required
                    />
                    <InputError message={errors.phone} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="email" value="Work email" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(event) => setData('email', event.target.value)}
                        required
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>
                <div>
                    <InputLabel value="Partner type" />
                    <div className="mt-2 flex gap-3">
                        {accountTypes.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setData('account_type', option.value)}
                                className={`w-full rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                                    data.account_type === option.value
                                        ? 'border-slate-900 bg-slate-900 text-white shadow shadow-slate-900/20'
                                        : 'border-slate-300 text-slate-600 hover:border-slate-400'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <InputError message={errors.account_type} className="mt-2" />
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
                <div>
                    <InputLabel htmlFor="password" value="Password" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(event) => setData('password', event.target.value)}
                        required
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="password_confirmation" value="Confirm password" />
                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(event) => setData('password_confirmation', event.target.value)}
                        required
                    />
                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>
            </div>
        </div>
    );

    const renderBusinessStep = () => (
        <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
                <div>
                    <InputLabel htmlFor="business_name" value="Business / store name" />
                    <TextInput
                        id="business_name"
                        name="business_name"
                        value={data.business_name}
                        className="mt-1 block w-full"
                        onChange={(event) => setData('business_name', event.target.value)}
                        required
                    />
                    <InputError message={errors.business_name} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="website" value="Website" />
                    <TextInput
                        id="website"
                        name="website"
                        value={data.website}
                        className="mt-1 block w-full"
                        placeholder="https://example.com"
                        onChange={(event) => setData('website', event.target.value)}
                    />
                    <InputError message={errors.website} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="gst_number" value="GST number" />
                    <TextInput
                        id="gst_number"
                        name="gst_number"
                        value={data.gst_number}
                        className="mt-1 block w-full"
                        placeholder="Optional"
                        onChange={(event) => setData('gst_number', event.target.value.toUpperCase())}
                    />
                    <InputError message={errors.gst_number} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="pan_number" value="PAN" />
                    <TextInput
                        id="pan_number"
                        name="pan_number"
                        value={data.pan_number}
                        className="mt-1 block w-full"
                        placeholder="Optional"
                        onChange={(event) => setData('pan_number', event.target.value.toUpperCase())}
                    />
                    <InputError message={errors.pan_number} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="registration_number" value="Business registration number" />
                    <TextInput
                        id="registration_number"
                        name="registration_number"
                        value={data.registration_number}
                        className="mt-1 block w-full"
                        placeholder="MSME / CIN / etc"
                        onChange={(event) => setData('registration_number', event.target.value)}
                    />
                    <InputError message={errors.registration_number} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="contact_name" value="Primary contact" />
                    <TextInput
                        id="contact_name"
                        name="contact_name"
                        value={data.contact_name}
                        className="mt-1 block w-full"
                        placeholder="Owner / authorised signatory"
                        onChange={(event) => setData('contact_name', event.target.value)}
                    />
                    <InputError message={errors.contact_name} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="contact_phone" value="Contact phone" />
                    <TextInput
                        id="contact_phone"
                        name="contact_phone"
                        value={data.contact_phone}
                        className="mt-1 block w-full"
                        placeholder="Optional"
                        onChange={(event) => setData('contact_phone', event.target.value)}
                    />
                    <InputError message={errors.contact_phone} className="mt-2" />
                </div>
            </div>
            <p className="text-sm text-slate-500">
                Tip: Upload these documents after registration to accelerate compliance reviews (GST certificate, PAN, store photographs).
            </p>
        </div>
    );

    const renderAddressStep = () => (
        <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                    <InputLabel htmlFor="address_line1" value="Address line 1" />
                    <TextInput
                        id="address_line1"
                        name="address_line1"
                        value={data.address_line1}
                        className="mt-1 block w-full"
                        onChange={(event) => setData('address_line1', event.target.value)}
                    />
                    <InputError message={errors.address_line1} className="mt-2" />
                </div>
                <div className="md:col-span-2">
                    <InputLabel htmlFor="address_line2" value="Address line 2" />
                    <TextInput
                        id="address_line2"
                        name="address_line2"
                        value={data.address_line2}
                        className="mt-1 block w-full"
                        onChange={(event) => setData('address_line2', event.target.value)}
                    />
                    <InputError message={errors.address_line2} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="city" value="City" />
                    <TextInput
                        id="city"
                        name="city"
                        value={data.city}
                        className="mt-1 block w-full"
                        onChange={(event) => setData('city', event.target.value)}
                    />
                    <InputError message={errors.city} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="state" value="State" />
                    <TextInput
                        id="state"
                        name="state"
                        value={data.state}
                        className="mt-1 block w-full"
                        onChange={(event) => setData('state', event.target.value)}
                    />
                    <InputError message={errors.state} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="postal_code" value="Postal code" />
                    <TextInput
                        id="postal_code"
                        name="postal_code"
                        value={data.postal_code}
                        className="mt-1 block w-full"
                        onChange={(event) => setData('postal_code', event.target.value)}
                    />
                    <InputError message={errors.postal_code} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="country" value="Country" />
                    <TextInput
                        id="country"
                        name="country"
                        value={data.country}
                        className="mt-1 block w-full"
                        onChange={(event) => setData('country', event.target.value)}
                    />
                    <InputError message={errors.country} className="mt-2" />
                </div>
            </div>
        </div>
    );

    const renderStepContent = () => {
        if (currentStep === 0) {
            return renderAccountStep();
        }
        if (currentStep === 1) {
            return renderBusinessStep();
        }
        return renderAddressStep();
    };

    const nextLabel = isLastStep ? 'Submit registration' : 'Continue';

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="mx-auto w-full max-w-3xl space-y-8">
                <header className="space-y-3 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Partner onboarding</p>
                    <h1 className="text-3xl font-semibold text-white">Create your partner account</h1>
                    <p className="text-sm text-slate-200/80">
                        Provide your business details so we can enable catalogue, jobwork, and wholesale pricing after verification.
                    </p>
                    <p className="text-sm text-slate-300">
                        Already registered?{' '}
                        <Link href={route('login')} className="font-semibold text-white underline decoration-slate-400 hover:decoration-white">
                            Log in instead
                        </Link>
                    </p>
                </header>

                <nav className="flex flex-wrap justify-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
                    {steps.map((step, index) => {
                        const isCurrent = index === currentStep;
                        const isComplete = index < currentStep;
                        return (
                            <button
                                key={step.title}
                                type="button"
                                onClick={() => (isComplete || isCurrent) && goToStep(index)}
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 transition ${
                                    isCurrent
                                        ? 'bg-white text-slate-900 shadow shadow-slate-900/15'
                                        : isComplete
                                        ? 'bg-white/20 text-white hover:bg-white/25'
                                        : 'bg-white/10 text-slate-300'
                                }`}
                                disabled={!isCurrent && !isComplete}
                            >
                                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isCurrent ? 'bg-slate-900 text-white' : 'bg-white/20 text-white'}`}>
                                    {index + 1}
                                </span>
                                {step.title}
                            </button>
                        );
                    })}
                </nav>

                <form onSubmit={submit} className="space-y-6 rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-slate-200/70">
                    <header className="space-y-1 border-b border-slate-200 pb-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Step {currentStep + 1} of {steps.length}</p>
                        <h2 className="text-xl font-semibold text-slate-900">{steps[currentStep].title}</h2>
                        <p className="text-sm text-slate-500">{steps[currentStep].description}</p>
                    </header>

                    {renderStepContent()}

                    <div className="flex items-center justify-between">
                        {currentStep > 0 ? (
                            <button
                                type="button"
                                onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                            >
                                ← Back
                            </button>
                        ) : (
                            <span />
                        )}

                        <PrimaryButton className="px-6" disabled={processing}>
                            {processing ? 'Submitting…' : nextLabel}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
