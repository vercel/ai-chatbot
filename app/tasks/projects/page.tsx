import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { taskProject } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Projects | WIZZO',
  description: 'Manage your task projects',
};

async function loadProjects(userId: string) {
  return await db
    .select()
    .from(taskProject)
    .where(and(
      eq(taskProject.userId, userId),
      eq(taskProject.isDeleted, false)
    ));
}

export default async function ProjectsPage() {
  const session = await getSession();
  
  if (!session?.user) {
    return <div>Please sign in to manage your projects.</div>;
  }
  
  const projects = await loadProjects(session.user.id);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cornsilk-500 mb-2">Projects</h1>
        <p className="text-cornsilk-300">Organize your tasks into projects.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="bg-hunter_green-500 border-hunter_green-600">
            <CardHeader>
              <CardTitle className="text-cornsilk-200">Your Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading projects...</div>}>
                <ClientProjectSection 
                  initialProjects={projects} 
                />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Use a client component to handle the interactivity
import { ClientProjectSection } from '@/components/tasks/client-project-section';