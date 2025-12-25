import { useEffect, useState } from 'react';

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
        bg: 'bg-elvee-blue/5',
        border: 'border-elvee-blue/20',
        text: 'text-elvee-blue',
    },
};

const statusMessages: Record<string, string> = {
    kyc_pending: 'Your KYC documents are under review. We will notify you as soon as the verification is complete.',
};

interface FlashMessageProps {
    flash?: Record<string, string | null>;
    type?: 'success' | 'error' | 'info';
    message?: string;
    onClose?: () => void;
}

export default function FlashMessage({ flash, type, message, onClose }: FlashMessageProps) {
    const [displayMessage, setDisplayMessage] = useState<{ type: keyof typeof variants; text: string } | null>(null);

    useEffect(() => {
        // If direct type and message props are provided, use those
        if (type && message) {
            setDisplayMessage({ type, text: message });
            return;
        }

        // Otherwise, use flash prop
        if (!flash) {
            setDisplayMessage(null);
            return;
        }

        if (flash.error) {
            setDisplayMessage({ type: 'error', text: flash.error });
        } else if (flash.success) {
            setDisplayMessage({ type: 'success', text: flash.success });
        } else if (flash.info) {
            setDisplayMessage({ type: 'info', text: flash.info });
        } else if (flash.status) {
            const statusKey = String(flash.status).trim();
            const statusText = statusMessages[statusKey] ?? statusKey;
            setDisplayMessage({ type: 'info', text: statusText });
        } else {
            setDisplayMessage(null);
        }
    }, [flash, type, message]);

    if (!displayMessage) {
        return null;
    }

    const variant = variants[displayMessage.type];

    return (
        <div
            className={`mb-6 rounded-2xl border ${variant.bg} ${variant.border} ${variant.text} px-4 py-3 text-sm shadow-sm transition`}
        >
            <div className="flex items-center justify-between">
                <span>{displayMessage.text}</span>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-4 text-current opacity-70 hover:opacity-100"
                        aria-label="Close"
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
}

