import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-xl border border-transparent bg-elvee-blue px-5 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-elvee-blue/25 transition duration-200 ease-out hover:bg-navy focus:bg-navy focus:outline-none focus:ring-2 focus:ring-feather-gold focus:ring-offset-2 focus:ring-offset-ivory active:bg-elvee-blue ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
