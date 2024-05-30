import { NavItem } from '@/app/dashboard/nav-item'
import {
  RiBuilding2Line,
  RiChat1Line,
  RiExchange2Line,
  RiStackLine,
  RiTimer2Line,
  RiWallet3Line
} from '@remixicon/react'

export const PanelSidebar = () => {
  return (
    <div className="flex-1 overflow-auto py-2">
      <nav className="items-start px-4 h-full text-sm font-medium flex flex-col justify-between">
        <div className="w-full">
          <NavItem href="/dashboard">
            <RiBuilding2Line size={16} />
            Companies
          </NavItem>
          <NavItem href="/">
            <RiWallet3Line size={16} />
            Finance
          </NavItem>
          <NavItem href="/">
            <RiTimer2Line size={16} />
            Monitors
          </NavItem>
          <NavItem href="/">
            <RiExchange2Line size={16} />
            Requests
          </NavItem>
          <NavItem href="/">
            <RiChat1Line size={16} />
            Tickets
          </NavItem>
        </div>
        <div className="w-full mb-2">
          <NavItem href="/panel" isActive>
            <RiStackLine size={16} />
            Control Panel
          </NavItem>
        </div>
      </nav>
    </div>
  )
}
