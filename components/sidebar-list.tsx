import { ThemeToggle } from '@/components/theme-toggle'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { useSubtitles } from '@/lib/hooks/subtitles-context'

interface SidebarListProps {
  children?: React.ReactNode
}

export async function SidebarList({}: SidebarListProps) {
  const { subtitlesState, setSubtitlesState } = useSubtitles()
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <ThemeToggle />
        <div className="flex items-center space-x-2">
          <Label htmlFor="subtitles">Subtitles</Label>
          <Switch
            id="subtitles"
            checked={subtitlesState}
            onCheckedChange={e => setSubtitlesState(e)}
          />
        </div>
      </div>
    </div>
  )
}
