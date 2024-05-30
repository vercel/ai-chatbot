import { RiArrowRightSLine } from '@remixicon/react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export const PanelPop = ({
  isRestricted,
  handleKey,
  handleAccess
}: {
  isRestricted?: boolean
  handleKey?: (e: any) => void
  handleAccess?: () => void
}) => {
  return (
    <div className="w-full h-screen grid place-items-center fixed backdrop-blur z-50 bg-white/50">
      <div className="access-pop flex items-center gap-2">
        <Input type="text" placeholder="Access Key" onChange={handleKey} />
        <Button onClick={handleAccess} className="p-2">
          <RiArrowRightSLine />
        </Button>
      </div>
    </div>
  )
}
