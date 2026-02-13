/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Montserrat', 'sans-serif'],
                display: ['Changa One', 'cursive'],
            },
            colors: {
                'void': '#050505',
                'primary': '#6366f1', // Indigo
                'accent': '#ec4899', // Pink
                'glass': 'rgba(255, 255, 255, 0.03)',
                'glass-border': 'rgba(255, 255, 255, 0.08)',
                'glass-high': 'rgba(255, 255, 255, 0.1)',
            },
            animation: {
                'blob': 'blob 10s infinite',
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.5s ease-out forwards',
                'cinematic': 'cinematic 1.5s ease-out forwards',
            },
            keyframes: {
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                cinematic: {
                    '0%': { opacity: '0', letterSpacing: '-0.1em', transform: 'scale(0.9)' },
                    '100%': { opacity: '1', letterSpacing: '0.05em', transform: 'scale(1)' },
                }
            }
        },
    },
    plugins: [],
}
