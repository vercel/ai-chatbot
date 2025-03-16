import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { taskProject } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { ClientTaskForm } from '@/components/tasks/client-task-form';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Create Task | WIZZO',
  description: 'Create a new task',
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

export default async function NewTaskPage() {
  const session = await getSession();
  
  if (!session?.user) {
    return <div>Please sign in to create a task.</div>;
  }
  
  const projects = await loadProjects(session.user.id);
  
  // Ensure at least one project exists
  if (projects.length === 0) {
    // Create a default project
    await db.insert(taskProject).values({
      userId: session.user.id,
      name: 'Inbox',
      color: '#3B82F6', // Blue
      isDefault: true,
    });
    
    // Reload page to show the new project
    redirect('/tasks/new');
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cornsilk-500 mb-2">Create New Task</h1>
        <p className="text-cornsilk-300">Add a new task to your list.</p>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <Card className="bg-hunter_green-500 border-hunter_green-600 shadow-lg">
          <CardHeader className="border-b border-hunter_green-600 pb-4">
            <CardTitle className="flex items-center text-cornsilk-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Task
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ClientTaskForm projects={projects} />
            
            <div className="mt-6 p-4 bg-hunter_green-600/30 rounded-md border border-hunter_green-700">
              <h3 className="font-medium text-cornsilk-400 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tips for effective tasks
              </h3>
              <ul className="space-y-1 text-sm text-cornsilk-300">
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Use clear, actionable language
                </li>
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Break complex tasks into smaller ones
                </li>
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                  Set appropriate priority levels
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}