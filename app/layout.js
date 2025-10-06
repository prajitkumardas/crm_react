import './globals.css'

export const metadata = {
  title: 'Smart Client Manager',
  description: 'Streamline client management for gyms, hostels, and coaching centers',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Smart Client Manager',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Smart Client Manager',
    title: 'Smart Client Manager',
    description: 'Streamline client management for gyms, hostels, and coaching centers',
  },
  twitter: {
    card: 'summary',
    title: 'Smart Client Manager',
    description: 'Streamline client management for gyms, hostels, and coaching centers',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}