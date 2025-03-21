import { Metadata } from 'next';
import { AppSidebar } from '@/components/app-sidebar';
import { getSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Chrome Extension | Wizzo',
  description: 'Manage content from the Chrome extension',
};

export default async function ExtensionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="h-screen flex">
      <AppSidebar user={session?.user} />
      <div className="flex-1 overflow-auto bg-background">
        {children}
      </div>
    </div>
  );
}