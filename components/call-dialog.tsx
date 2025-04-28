import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Call } from './sidebar-call-item';
import { PhoneIcon, VideoIcon } from './icons';

interface CallDialogProps {
  call: Call | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallDialog({ call, open, onOpenChange }: CallDialogProps) {
  if (!call) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {call.callType === 'video' ? <VideoIcon size={20} /> : <PhoneIcon size={20} />}
            <DialogTitle className="text-xl">{call.title}</DialogTitle>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <span>{call.participantCount} participants</span>
            <span>•</span>
            <span>{call.duration} min</span>
            <span>•</span>
            <span className={`${call.callStatus === 'missed' ? 'text-destructive' : ''}`}>
              {call.callStatus}
            </span>
          </div>
        </DialogHeader>

        <Tabs defaultValue="summary" className="flex-1 overflow-hidden">
          <TabsList className="w-full justify-start h-12 p-0 bg-background">
            <TabsTrigger
              value="summary"
              className="data-[state=active]:bg-muted rounded-none h-full px-4"
            >
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="transcription"
              className="data-[state=active]:bg-muted rounded-none h-full px-4"
            >
              Transcription
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="summary" className="mt-0 text-sm">
              <div className="prose dark:prose-invert max-w-none">
                {call.summary}
              </div>
            </TabsContent>

            <TabsContent value="transcription" className="mt-0">
              <div className="space-y-4">
                {call.transcription.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-20 shrink-0 text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.speaker}</div>
                      <div className="text-sm">{item.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 