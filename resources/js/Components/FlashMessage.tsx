import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

const variants: Record<string, { bg: string; border: string; text: string }> = {
    success: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-900',
    },
    error: {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-900',
    },
    info: {
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        text: 'text-sky-900',
    },
};

const statusMessages: Record<string, string> = {
    kyc_pending: 'Your KYC documents are under review. We will notify you as soon as the verification is complete.',
};

export default function FlashMessage() {
    const { flash } = usePage().props as { flash?: Record<string, string | null> };
    const [message, setMessage] = useState<{ type: keyof typeof variants; text: string } | null>(null);

    useEffect(() => {
        if (!flash) {
            setMessage(null);
            return;
        }

        if (flash.error) {
            setMessage({ type: 'error', text: flash.error });
        } else if (flash.success) {
            setMessage({ type: 'success', text: flash.success });
        } else if (flash.info) {
            setMessage({ type: 'info', text: flash.info });
        } else if (flash.status) {
            const statusKey = String(flash.status).trim();
            const statusText = statusMessages[statusKey] ?? statusKey;
            setMessage({ type: 'info', text: statusText });
        } else {
            setMessage(null);
        }
    }, [flash]);

    if (!message) {
        return null;
    }

    const variant = variants[message.type];

    return (
        <div
            className={`mb-6 rounded-2xl border ${variant.bg} ${variant.border} ${variant.text} px-4 py-3 text-sm shadow-sm transition`}
        >
            {message.text}
        </div>
    );
}
