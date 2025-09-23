/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#5B6CFF', // Primary Blue
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        secondary: {
          50: '#F8F9FA',
          100: '#E9ECEF',
          200: '#DEE2E6',
          300: '#CED4DA',
          400: '#ADB5BD',
          500: '#6C757D', // Neutral Gray
          600: '#495057',
          700: '#343A40',
          800: '#212529',
          900: '#000000',
        },
        // Status Colors
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#2ECC71', // Success Green
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F39C12', // Warning Orange
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#E74C3C', // Danger Red
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3498DB', // Info Blue
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Text Colors
        text: {
          primary: '#1A1A1A',
          secondary: '#6C6C6C',
          inverse: '#FFFFFF',
        },
        // Background Colors
        bg: {
          primary: '#FFFFFF',
          secondary: '#F7F8FA',
          card: '#FFFFFF',
        },
        // Border Colors
        border: {
          light: '#E5E7EB',
          medium: '#D1D5DB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Nunito', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '18px', letterSpacing: '0px' }],
        'sm': ['14px', { lineHeight: '22px', letterSpacing: '0px' }],
        'base': ['16px', { lineHeight: '24px', letterSpacing: '0px' }],
        'lg': ['18px', { lineHeight: '28px', letterSpacing: '0px' }],
        'xl': ['20px', { lineHeight: '28px', letterSpacing: '0.25px' }],
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '0.25px' }],
        '3xl': ['30px', { lineHeight: '36px', letterSpacing: '0.25px' }],
        '4xl': ['36px', { lineHeight: '40px', letterSpacing: '0.25px' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'strong': '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'xl': '12px',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
}
