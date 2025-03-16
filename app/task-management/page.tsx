import { Suspense } from 'react';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { taskItem, taskProject } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { TaskManagementClient } from '@/components/task-management/task-management-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Task Management | WIZZO',
  description: 'Manage all your tasks in one place',
};

async function loadData(userId: string) {
  // Get all tasks for the user that aren't deleted
  const tasks = await db
    .select()
    .from(taskItem)
    .where(and(
      eq(taskItem.userId, userId),
      eq(taskItem.isDeleted, false)
    ));
  
  // Get all projects for the user that aren't deleted
  const projects = await db
    .select()
    .from(taskProject)
    .where(and(
      eq(taskProject.userId, userId),
      eq(taskProject.isDeleted, false)
    ));
  
  return { tasks, projects };
}

export default async function TaskManagementPage() {
  const session = await getSession();
  
  if (!session?.user) {
    return <div>Please sign in to manage your tasks.</div>;
  }
  
  const { tasks, projects } = await loadData(session.user.id);
  
  // Ensure at least one project exists (create default project if none exists)
  if (projects.length === 0) {
    // Create a default project
    await db.insert(taskProject).values({
      userId: session.user.id,
      name: 'Inbox',
      color: '#3B82F6', // Blue
      isDefault: true,
    });
    
    // Reload the page to get the new project
    return <meta httpEquiv="refresh" content="0" />;
  }
  
  return (
    <div className="h-full container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-cornsilk-500">Task Management</h1>
        <p className="text-cornsilk-300 mt-1">Organize, prioritize, and complete your tasks efficiently.</p>
      </div>
      
      <Suspense fallback={<div>Loading tasks...</div>}>
        <TaskManagementClient 
          initialTasks={tasks} 
          initialProjects={projects} 
        />
      </Suspense>
    </div>
  );
}