import { LabelHTMLAttributes } from 'react';

export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { value?: string }) {
    return (
        <label
            {...props}
            className={
                `block text-xs font-medium text-gray-700 sm:text-sm ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
