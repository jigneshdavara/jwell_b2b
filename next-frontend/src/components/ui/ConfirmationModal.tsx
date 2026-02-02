'use client';

import Modal from './Modal';
import SecondaryButton from './SecondaryButton';

type ConfirmationModalProps = {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    processing?: boolean;
};

export default function ConfirmationModal({
    show,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    processing = false,
}: ConfirmationModalProps) {
    const variantStyles = {
        danger: { button: 'bg-rose-600 hover:bg-rose-700', icon: 'text-rose-600' },
        warning: { button: 'bg-amber-600 hover:bg-amber-700', icon: 'text-amber-600' },
        info: { button: 'bg-elvee-blue hover:bg-navy', icon: 'text-elvee-blue' },
    };
    const currentVariant = variantStyles[variant];

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                        {variant === 'danger' && <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${currentVariant.icon}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
                        {variant === 'warning' && <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${currentVariant.icon}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>}
                        {variant === 'info' && <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${currentVariant.icon}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h3>
                        <p className="mt-1.5 text-xs text-slate-600 sm:mt-2 sm:text-sm break-words">{message}</p>
                    </div>
                </div>
                <div className="mt-4 flex flex-row justify-end gap-2 sm:mt-6 sm:gap-3">
                    <SecondaryButton onClick={onClose} disabled={processing} className="flex-1 sm:flex-none">
                        {cancelText}
                    </SecondaryButton>
                    <button 
                        type="button" 
                        onClick={onConfirm} 
                        disabled={processing} 
                        className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold text-white shadow-lg transition disabled:opacity-70 sm:flex-none sm:px-4 sm:text-sm ${currentVariant.button}`}
                    >
                        {processing ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

