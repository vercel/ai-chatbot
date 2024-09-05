import { ThemeToggle } from '@/components/theme-toggle'

interface SidebarListProps {
  children?: React.ReactNode
}

export async function SidebarList({}: SidebarListProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <ThemeToggle />
      </div>
    </div>
  )
}
