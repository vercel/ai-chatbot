import { AppHeader } from '@/components/app-header';

export default function PromptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
