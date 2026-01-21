import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Montserrat', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: '#F81A42',
                secondary: '#5B21B6',
                surface: '#F5EFFF',
                surface2: '#EDE9FE',
                dark: '#272D2D',
                accent: '#5EF38C',
            },
        },
    },

    plugins: [forms],
};
