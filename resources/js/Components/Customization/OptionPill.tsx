import { type ReactNode } from 'react';

interface OptionPillProps {
    children: ReactNode;
    isSelected: boolean;
    isDisabled?: boolean;
    onClick: () => void;
}

/**
 * OptionPill Component
 * 
 * Premium pill button for metal and diamond selection.
 * Matches Elvee's modern luxury theme with minimal design.
 */
export default function OptionPill({ children, isSelected, isDisabled = false, onClick }: OptionPillProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isDisabled}
            className={`
                inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-all shadow-sm
                ${isSelected
                    ? 'bg-[#0E244D] text-white shadow-md'
                    : isDisabled
                    ? 'border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                    : 'border border-[#0E244D]/30 bg-white text-[#0E244D] hover:bg-[#F8F5F0] hover:border-[#0E244D]/50'
                }
            `}
        >
            {children}
        </button>
    );
}
