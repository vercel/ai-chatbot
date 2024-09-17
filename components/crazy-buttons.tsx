import { Button } from './ui/button'

// @ts-nocheck
export default function CrazyButtons({
  setIsChatOpen
}: {
  setIsChatOpen: (open: boolean) => void
}) {
  const TipCard = ({
    title,
    description
  }: {
    title: string
    description: string
  }) => (
    <div
      className={
        'p-2 border border-zinc-200 rounded-md cursor-help dark:border-zinc-700 dark:bg-zinc-800 w-full'
      }
    >
      <span className="text-base font-medium">{title}</span>
      <p className="text-sm font-light">{description}</p>
    </div>
  )
  return (
    <div
      className="flex flex-row items-around gap-1"
      style={{
        maxWidth: '50vw',
        height: '85vh' // Fixed height
      }}
    >
      <div className="flex flex-col items-start justify-start gap-2 height-full flex-3">
        <span className="text-xl font-semibold dark:text-white text-black">
          Tips for learning with Clara
        </span>
        <TipCard
          title="Try dictating a message"
          description="Just start talking, your pronunciation matters"
        />
        <TipCard
          title="Ask about anything"
          description="Clara can help you with a lot of things, just ask"
        />
        <TipCard
          title="Hover the vocabulary words"
          description="Hover the words to see their meaning"
        />
        <TipCard
          title="Click on the vocabulary words"
          description="Clara will help you with the pronunciation, and read the definition"
        />
        <TipCard
          title="Change the background"
          description="Go to settings on the sidebar to change the background"
        />
        <TipCard
          title="Make Clara smile"
          description="You can test out Clara's emotes on the sidebar"
        />
        <TipCard
          title="Be nice to your teacher"
          description="Be patient and learn a ton!"
        />
      </div>
      <div className="flex flex-col items-end justify-end gap-2 height-full flex-1">
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
    </div>
  )
}
