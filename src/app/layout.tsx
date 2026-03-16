import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ureola',
  description: "What's on your mind?",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="aurora" aria-hidden="true">
          <div className="aurora-orb" />
          <div className="aurora-orb" />
          <div className="aurora-orb" />
          <div className="aurora-orb" />
        </div>
        {children}
      </body>
    </html>
  )
}
