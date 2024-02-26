import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from './collapsible'
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import { FC, useState } from 'react'

interface AdvancedSettingsProps {
  children: React.ReactNode
}

export const AdvancedSettings: FC<AdvancedSettingsProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpenChange = (isOpen: boolean) => {
    setIsOpen(isOpen)
  }

  return (
    <Collapsible className="pt-2" open={isOpen} onOpenChange={handleOpenChange}>
      <CollapsibleTrigger className="hover:opacity-50">
        <div className="flex items-center font-bold">
          <div className="mr-1">Advanced Settings</div>
          {isOpen ? (
            <IconChevronDown size={20} stroke={3} />
          ) : (
            <IconChevronRight size={20} stroke={3} />
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4">{children}</CollapsibleContent>
    </Collapsible>
  )
}
