import type { Metadata } from 'next'
import { Unbounded, Figtree, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800', '900'],
})

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'SHB Competition Hub',
  description: 'Interschool competition management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${figtree.variable} ${ibmPlexMono.variable}`}>
      <body className="font-body bg-page text-slate-900 antialiased">{children}</body>
    </html>
  )
}
