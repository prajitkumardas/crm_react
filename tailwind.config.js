/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System Colors
        primary: '#3A7AFE', // Blue 500
        'primary-hover': '#2E63D8', // Blue 600
        secondary: '#5CB8FF', // Sky 400
        accent: '#FFA84C', // Orange 400
        'bg-light': '#F7F9FC',
        surface: '#FFFFFF',
        'text-primary': '#1E1E1E',
        'text-secondary': '#5C5C5C',
        'text-muted': '#9CA3AF',
        border: '#E5E7EB',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        // Dark mode variants
        'bg-dark': '#1A1C1E',
        'surface-dark': '#2A2D31',
        'text-primary-dark': '#FFFFFF',
        'border-dark': '#3C3F45',
      },
      fontFamily: {
        display: ['Poppins', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Inter', 'Roboto', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Inter', 'Roboto', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['40px', { lineHeight: '1.4', fontWeight: '700' }],
        'display-md': ['32px', { lineHeight: '1.4', fontWeight: '700' }],
        'heading-lg': ['28px', { lineHeight: '1.5', fontWeight: '600' }],
        'heading-md': ['24px', { lineHeight: '1.5', fontWeight: '600' }],
        'heading-sm': ['20px', { lineHeight: '1.5', fontWeight: '600' }],
        'subheading': ['18px', { lineHeight: '1.5', fontWeight: '500' }],
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
        'button': ['14px', { lineHeight: '1.4', fontWeight: '600', textTransform: 'uppercase' }],
      },
      spacing: {
        'xs': '4px',
        's': '8px',
        'm': '12px',
        'l': '16px',
        'xl': '24px',
        'xxl': '32px',
      },
      boxShadow: {
        'small': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'strong': '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'small': '6px',
        'medium': '8px',
        'large': '12px',
        'xl': '16px',
      },
      screens: {
        'xs': '475px',
        'tablet': '768px',
        'desktop': '1024px',
        'wide': '1440px',
      },
      maxWidth: {
        'container': '1440px',
      },
      gridTemplateColumns: {
        'desktop': 'repeat(12, minmax(0, 1fr))',
        'tablet': 'repeat(8, minmax(0, 1fr))',
        'mobile': 'repeat(4, minmax(0, 1fr))',
      },
      gap: {
        'gutter-desktop': '24px',
        'gutter-tablet': '16px',
        'gutter-mobile': '8px',
      },
    },
  },
  plugins: [],
}
