import { ButtonHTMLAttributes } from 'react';

export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center justify-center rounded-md border border-steel bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm transition duration-150 ease-in-out hover:bg-ivory focus:outline-none focus:ring-2 focus:ring-feather-gold focus:ring-offset-1 disabled:opacity-25 sm:px-4 sm:py-2 sm:focus:ring-offset-2 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}

