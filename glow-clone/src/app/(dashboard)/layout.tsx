'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/campaigns', label: 'Campaigns' },
  { href: '/content', label: 'Content' },
  { href: '/seo', label: 'SEO' },
  { href: '/integrations', label: 'Integrations' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
          <div className="font-semibold">Glow Clone</div>
          <nav className="flex gap-4 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  'px-2 py-1 rounded ' +
                  (pathname?.startsWith(item.href)
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100')
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}