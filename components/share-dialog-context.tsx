import React, { ReactNode, useContext, useState, createContext } from 'react';
import { ShareDialog } from './shareDialog';

type VisibilityType = 'private' | 'organisation';

interface ShareDialogContextProps {
  openShareDialog: (chatId: string, visibilityType: VisibilityType) => void;
}

const ShareDialogContext = createContext<ShareDialogContextProps | undefined>(
  undefined,
);

export function useShareDialog() {
  const ctx = useContext(ShareDialogContext);
  if (!ctx)
    throw new Error('useShareDialog must be used within ShareDialogProvider');
  return ctx;
}

export function ShareDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [visibilityType, setVisibilityType] =
    useState<VisibilityType>('private');
  const [summary, setSummary] = useState<string | undefined>(undefined);

  const openShareDialog = (
    id: string,
    visibility: VisibilityType,
    summary?: string,
  ) => {
    setChatId(id);
    setVisibilityType(visibility);
    setSummary(summary);
    setOpen(true);
  };

  return (
    <ShareDialogContext.Provider value={{ openShareDialog }}>
      {children}
      {chatId && (
        <ShareDialog
          open={open}
          onOpenChange={setOpen}
          chatId={chatId}
          visibilityType={visibilityType}
          summary={summary}
        />
      )}
    </ShareDialogContext.Provider>
  );
}
