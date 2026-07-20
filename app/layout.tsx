import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

const getSiteUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.startsWith('http')
      ? process.env.NEXT_PUBLIC_SITE_URL
      : `https://${process.env.NEXT_PUBLIC_SITE_URL}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: 'Waruna Bopitiya | I See ICT - A/L ICT Learning Platform',
  description: 'Official Advanced Level ICT learning platform in Sri Lanka by Waruna Bopitiya (I See ICT). Access video tutorials, notes, past paper grading, and exam prep.',
  keywords: ['Waruna Bopitiya', 'I See ICT', 'AL ICT', 'Sri Lanka', 'ICT class', 'ICT by Waruna Bopitiya', 'HelaCode'],
  authors: [{ name: 'Waruna Bopitiya' }],
  creator: 'Waruna Bopitiya',
  publisher: 'Waruna Bopitiya',
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/icon.svg',
  },
}

import InteractiveDotGrid from '@/components/InteractiveDotGrid'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <InteractiveDotGrid />
          <div className="relative z-10 min-h-screen">
            {children}
          </div>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

