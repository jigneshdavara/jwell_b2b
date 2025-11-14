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
                'elvee-blue': '#0E244D',
                'feather-gold': '#AE8135',
                'ivory': '#F8F5F0',
                'warm-gold': '#927038',
                'steel': '#B6B6B6',
                'navy': '#0A1F47',
                'ink': '#0C1424',
            },
        },
    },

    plugins: [forms],
};
