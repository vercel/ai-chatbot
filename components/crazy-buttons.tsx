import { Button } from './ui/button'

// @ts-nocheck
export default function CrazyButtons({
  setIsChatOpen
}: {
  setIsChatOpen: (open: boolean) => void
}) {
  return (
    <div
      className="flex flex-col items-end justify-end gap-2"
      style={{
        maxWidth: '50vw',
        height: '85vh' // Fixed height
      }}
    >
      <Button disabled variant={'secondary'}>
        📅
      </Button>
      <Button disabled variant={'secondary'}>
        🏆
      </Button>
      <Button disabled variant={'secondary'}>
        🎁
      </Button>
      <Button disabled variant={'secondary'}>
        📖
      </Button>
      <Button disabled variant={'secondary'}>
        📞
      </Button>
      <Button onClick={() => setIsChatOpen(true)}>💬</Button>
    </div>
  )
}
