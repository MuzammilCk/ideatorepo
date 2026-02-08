/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}" // covering files in root too like App.tsx if they are not in src
    ],
    theme: {
        extend: {
            colors: {
                nightBlack: "#050505",
                nightDark: "#0a0a0a",
                electricBlue: "#3b82f6", // Blue-500
                deepBlue: "#1e3a8a", // Blue-900
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            boxShadow: {
                'blue-glow': '0 0 15px rgba(59, 130, 246, 0.5)',
            }
        },
    },
    plugins: [],
}
