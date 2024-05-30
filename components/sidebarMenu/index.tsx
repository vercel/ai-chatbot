import { NavItem } from '@/app/dashboard/nav-item'
import {
  RiExchange2Line,
  RiPieChartLine,
  RiSettingsLine,
  RiShieldStarLine,
  RiStackLine,
  RiUser4Line
} from '@remixicon/react'

export const SidebarMenu = () => {
  return (
    <div className="flex-1 overflow-auto py-2">
      <nav className="grid items-start px-4 text-sm font-medium">
        <NavItem href="/">
          <RiUser4Line size={16} />
          Access
        </NavItem>
        <NavItem href="/">
          <RiExchange2Line size={16} />
          Connections
        </NavItem>
        <NavItem href="/">
          <RiPieChartLine size={16} />
          Analytics
        </NavItem>
        <NavItem href="/">
          <RiShieldStarLine size={16} />
          Organization
        </NavItem>
        <NavItem href="/">
          <RiSettingsLine size={16} />
          Configuration
        </NavItem>
        <NavItem href="/">
          <RiStackLine size={16} />
          Control Panel
        </NavItem>
      </nav>
    </div>
  )
}
