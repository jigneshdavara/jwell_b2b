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
                sans: ['"DM Sans"', ...defaultTheme.fontFamily.sans],
                display: ['"Playfair Display"', ...defaultTheme.fontFamily.serif],
                serif: ['"Playfair Display"', ...defaultTheme.fontFamily.serif],
            },
            colors: {
                brand: {
                    50: '#f5f5ff',
                    100: '#eceafe',
                    200: '#d8d4fd',
                    300: '#b9affb',
                    400: '#8b79f7',
                    500: '#6f57f4',
                    600: '#593de8',
                    700: '#4a31c7',
                    800: '#3f2ba3',
                    900: '#372882',
                },
                accent: {
                    50: '#fff4ed',
                    100: '#ffe4d6',
                    200: '#ffc3ad',
                    300: '#ff9a7a',
                    400: '#ff6f44',
                    500: '#fe4f1c',
                    600: '#f23c10',
                    700: '#c32c0c',
                    800: '#99240e',
                    900: '#7b200f',
                },
                graphite: {
                    50: '#f7f7f8',
                    100: '#ececf0',
                    200: '#d9d9e3',
                    300: '#bcbccd',
                    400: '#8f8fa6',
                    500: '#6d6d86',
                    600: '#51516d',
                    700: '#404056',
                    800: '#2d2d3b',
                    900: '#1f1f2a',
                },
            },
            backgroundImage: {
                'hero-radial':
                    'radial-gradient(circle at top left, rgba(111, 87, 244, 0.55), transparent 55%), radial-gradient(circle at bottom right, rgba(254, 79, 28, 0.45), transparent 55%)',
                'hero-linear':
                    'linear-gradient(135deg, rgba(20, 16, 41, 0.95) 0%, rgba(44, 18, 65, 0.9) 52%, rgba(111, 87, 244, 0.85) 100%)',
            },
            boxShadow: {
                'floating-card': '0 24px 60px -25px rgba(31, 20, 64, 0.25)',
                'soft-panel': '0 18px 40px -20px rgba(57, 33, 99, 0.35)',
            },
            borderRadius: {
                '5xl': '2.75rem',
            },
        },
    },

    plugins: [forms],
};
