import Modal from './Modal';
import PrimaryButton from './PrimaryButton';

type AlertModalProps = {
    show: boolean;
    onClose: () => void;
    title: string;
    message: string;
    buttonText?: string;
    variant?: 'info' | 'warning' | 'error';
};

export default function AlertModal({
    show,
    onClose,
    title,
    message,
    buttonText = 'OK',
    variant = 'info',
}: AlertModalProps) {
    const variantStyles = {
        info: {
            icon: 'text-elvee-blue',
            bg: 'bg-elvee-blue/10',
        },
        warning: {
            icon: 'text-amber-600',
            bg: 'bg-amber-600/10',
        },
        error: {
            icon: 'text-rose-600',
            bg: 'bg-rose-600/10',
        },
    };

    const currentVariant = variantStyles[variant];

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <div className="flex items-start">
                    <div className={`flex-shrink-0 rounded-full p-2 ${currentVariant.bg}`}>
                        {variant === 'info' && (
                            <svg
                                className={`h-6 w-6 ${currentVariant.icon}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                                />
                            </svg>
                        )}
                        {variant === 'warning' && (
                            <svg
                                className={`h-6 w-6 ${currentVariant.icon}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                />
                            </svg>
                        )}
                        {variant === 'error' && (
                            <svg
                                className={`h-6 w-6 ${currentVariant.icon}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        )}
                    </div>
                    <div className="ml-4 flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                        <p className="mt-2 text-sm text-slate-600">{message}</p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <PrimaryButton onClick={onClose}>{buttonText}</PrimaryButton>
                </div>
            </div>
        </Modal>
    );
}

