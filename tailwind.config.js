import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Avenir', 'Montserrat', 'Nunito', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // Elvee Blue Palette (Base: #0A1F47)
                // Usage: bg-elvee-blue (defaults to 900), bg-elvee-blue-700, text-elvee-blue-500, etc.
                'elvee-blue': {
                    DEFAULT: '#0A1F47', // Default/base - Primary text, headings, navigation (maps to 900)
                    900: '#0A1F47', // Base (navy) - Primary text, headings, navigation
                    700: '#0E244D', // Lighter variant - Secondary text, borders
                    500: '#1A3A6B', // Softer UI elements - Backgrounds, subtle borders
                    300: '#2D4F8F', // Light backgrounds, borders
                },
                // Feather Gold Palette (Base: #927038)
                // Usage: bg-feather-gold (defaults to 900), bg-feather-gold-700, text-feather-gold-500, etc.
                'feather-gold': {
                    DEFAULT: '#927038', // Default/base - Primary accent (maps to 900)
                    900: '#927038', // Base (warm-gold) - Primary accent
                    700: '#AE8135', // Lighter variant - Secondary highlights
                    500: '#C99A4A', // Subtle emphasis - Soft backgrounds
                    300: '#E4B85F', // Very light backgrounds
                },
                // Steel/Grey Palette (Base: #B6B6B6)
                // Usage: bg-steel (defaults to 500), bg-steel-300, text-steel-200, etc.
                'steel': {
                    DEFAULT: '#B6B6B6', // Default/base - Disabled states, borders (maps to 500)
                    500: '#B6B6B6', // Base - Disabled states, borders
                    300: '#D1D1D1', // Dividers - Lighter borders
                    200: '#E5E5E5', // Backgrounds - Very light surfaces
                    100: '#F5F5F5', // Very light UI surfaces
                },
                // Additional brand colors
                'ivory': '#F8F5F0', // Default background
                'navy': '#0A1F47', // Alias for elvee-blue-900
                'ink': '#0C1424', // Dark text color
            },
        },
    },

    plugins: [forms],
};
