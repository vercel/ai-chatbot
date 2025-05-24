import { AppHeader } from '@/components/app-header';

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 pt-6">
        {children}
      </main>
    </div>
  );
}
