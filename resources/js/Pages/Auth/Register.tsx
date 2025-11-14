import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

const ArrowRightIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 8h10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m9.5 4.5 3.5 3.5-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

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

const documentChecklist = ['GST certificate', 'PAN card', 'Storefront photos', 'Business registration / CIN / MSME'];

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
                                        ? 'border-elvee-blue bg-elvee-blue text-white shadow-lg shadow-elvee-blue/30'
                                        : 'border-elvee-blue/20 bg-ivory text-elvee-blue hover:border-feather-gold/60 hover:text-feather-gold'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
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
                    />
                    <InputError message={errors.business_name} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="website" value="Website / Instagram" />
                    <TextInput
                        id="website"
                        name="website"
                        value={data.website}
                        className="mt-1 block w-full"
                        placeholder="@yourbrand or www.example.com"
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
                        className="mt-1 block w-full uppercase tracking-[0.2em]"
                        onChange={(event) => setData('gst_number', event.target.value)}
                    />
                    <InputError message={errors.gst_number} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="pan_number" value="PAN number" />
                    <TextInput
                        id="pan_number"
                        name="pan_number"
                        value={data.pan_number}
                        className="mt-1 block w-full uppercase tracking-[0.2em]"
                        onChange={(event) => setData('pan_number', event.target.value)}
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
            <p className="text-sm text-ink/70">
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
                        className="mt-1 block w-full tracking-[0.3em]"
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
            <p className="text-sm text-ink/70">
                Dispatch-ready partners receive pick-up coordination, insured shipments, and concierge updates.
            </p>
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

            <div className="mx-auto w-full max-w-6xl gap-10 lg:grid lg:grid-cols-[380px,minmax(0,1fr)]">
                <aside className="mb-8 space-y-6 rounded-3xl bg-white/80 p-8 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10 backdrop-blur lg:mb-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-feather-gold">Partner onboarding</p>
                    <h1 className="text-3xl font-semibold text-elvee-blue">Let's introduce your jewellery house</h1>
                    <p className="text-sm text-ink/80">
                        Share business credentials and addresses to unlock curated catalogues, bullion hedging, and wholesale jobwork in one secure space.
                    </p>

                    <div className="space-y-4">
                        {steps.map((step, index) => {
                            const isCurrent = index === currentStep;
                            const isComplete = index < currentStep;
                            return (
                                <div
                                    key={step.title}
                                    className={`rounded-2xl border p-4 ${isCurrent ? 'border-elvee-blue bg-white shadow-lg shadow-elvee-blue/10' : 'border-elvee-blue/15 bg-ivory'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                                                isCurrent
                                                    ? 'bg-elvee-blue text-white'
                                                    : isComplete
                                                    ? 'bg-feather-gold text-white'
                                                    : 'bg-white text-elvee-blue'
                                            }`}
                                        >
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-elvee-blue">{step.title}</p>
                                            <p className="text-xs text-ink/70">{step.description}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="space-y-3 rounded-2xl border border-dashed border-feather-gold/60 bg-feather-gold/5 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-feather-gold">Recommended documents</p>
                        <ul className="space-y-2 text-sm text-ink/80">
                            {documentChecklist.map((item) => (
                                <li key={item} className="flex items-start gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-feather-gold" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                </aside>

                <section className="space-y-6">
                    <div className="rounded-3xl bg-white/80 p-6 text-sm text-ink/80 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10 backdrop-blur">
                        Already registered?{' '}
                        <Link href={route('login')} className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold">
                            Log in instead
                        </Link>
                    </div>

                    <form onSubmit={submit} className="space-y-6 rounded-3xl bg-white p-8 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10">
                        <header className="space-y-4 border-b border-elvee-blue/10 pb-6">
                            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-ink/60">
                                <span>Step {currentStep + 1} of {steps.length}</span>
                                <span className="h-px flex-1 bg-elvee-blue/10" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-elvee-blue">{steps[currentStep].title}</h2>
                                <p className="text-sm text-ink/70">{steps[currentStep].description}</p>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.2em]">
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
                                                    ? 'bg-elvee-blue text-white shadow shadow-elvee-blue/30'
                                                    : isComplete
                                                    ? 'bg-feather-gold/20 text-elvee-blue'
                                                    : 'bg-ivory text-ink/60'
                                            }`}
                                            disabled={!isCurrent && !isComplete}
                                        >
                                            <span
                                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                                                    isCurrent
                                                        ? 'bg-white text-elvee-blue'
                                                        : isComplete
                                                        ? 'bg-feather-gold text-white'
                                                        : 'bg-white/60 text-elvee-blue'
                                                }`}
                                            >
                                                {index + 1}
                                            </span>
                                            {step.title}
                                        </button>
                                    );
                                })}
                            </div>
                        </header>

                        {renderStepContent()}

                        <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            {currentStep > 0 ? (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
                                    className="inline-flex items-center justify-center rounded-full border border-elvee-blue/30 px-5 py-3 text-sm font-semibold text-elvee-blue transition hover:border-feather-gold/60 hover:text-feather-gold"
                                >
                                    Back
                                </button>
                            ) : (
                                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-ink/60">Start your profile</span>
                            )}

                            <PrimaryButton className="min-w-[200px] gap-2" disabled={processing}>
                                <span>{processing ? 'Submitting...' : nextLabel}</span>
                                {!processing && <ArrowRightIcon />}
                            </PrimaryButton>
                        </div>
                    </form>
                </section>
            </div>
        </GuestLayout>
    );
}
