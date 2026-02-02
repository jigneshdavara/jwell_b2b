import { forwardRef, SelectHTMLAttributes } from 'react';
import { inputBaseClasses } from '@/utils/inputStyles';

export default forwardRef(function Select(
    {
        className = '',
        ...props
    }: SelectHTMLAttributes<HTMLSelectElement>,
    ref: React.Ref<HTMLSelectElement>,
) {
    return (
        <select
            {...props}
            className={`${inputBaseClasses} ${className}`}
            ref={ref}
        />
    );
});

