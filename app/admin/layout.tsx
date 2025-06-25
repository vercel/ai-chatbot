import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user as userSchema } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar'; // Assuming a sidebar component exists
import { SidebarProvider } from '@/components/ui/sidebar'; // Assuming for sidebar context

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect('/login?message=Please login to access the admin panel.');
    return null;
  }

  const adminUser = await db
    .select({ isAdmin: userSchema.isAdmin })
    .from(userSchema)
    .where(eq(userSchema.id, session.user.id))
    .limit(1);

  if (adminUser.length === 0 || !adminUser[0].isAdmin) {
    // Or redirect to a generic "Unauthorized" page
    redirect('/?message=You are not authorized to view this page.');
    return null;
  }

  // User is an admin, render the layout
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AppSidebar className="w-1/5" /> {/* Example: Adjust width as needed */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
