'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavItem({
  href,
  isActive,
  children
}: {
  href: string
  isActive?: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <Link
      href={href}
      className={clsx(
        `flex items-center gap-3 rounded-lg px-3 py-2 ${isActive ? 'border-[1px] border-[#e4e4e7]' : ''} text-gray-900 hover:bg-gray-200/60  transition-all hover:text-gray-900 `,
        {
          'bg-gray-100 ': pathname === href
        }
      )}
    >
      {children}
    </Link>
  )
}
