import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { TaskClient } from '@/components/tasks/task-client';
import { taskItem, taskProject } from '@/lib/db/schema';
import { eq, and, lte, gte, isNotNull } from 'drizzle-orm';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Today\'s Tasks | WIZZO',
  description: 'Manage your tasks for today',
};

async function loadData(userId: string) {
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);
  
  // Serialize dates to ISO strings for database query
  const startISOString = startOfToday.toISOString();
  const endISOString = endOfToday.toISOString();
  
  // Get today's tasks (due today)
  const tasks = await db
    .select()
    .from(taskItem)
    .where(and(
      eq(taskItem.userId, userId),
      eq(taskItem.isDeleted, false),
      isNotNull(taskItem.dueDate),
      gte(taskItem.dueDate, startISOString),
      lte(taskItem.dueDate, endISOString)
    ));
  
  // Get all projects
  const projects = await db
    .select()
    .from(taskProject)
    .where(and(
      eq(taskProject.userId, userId),
      eq(taskProject.isDeleted, false)
    ));
  
  return { tasks, projects };
}

export default async function TodayTasksPage() {
  const session = await getSession();
  
  if (!session?.user) {
    return <div>Please sign in to view your tasks.</div>;
  }
  
  const { tasks, projects } = await loadData(session.user.id);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cornsilk-500 mb-2">Today's Tasks</h1>
        <p className="text-cornsilk-300">Focus on what you need to do today.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="bg-hunter_green-500 border-hunter_green-600">
            <CardHeader>
              <CardTitle className="text-cornsilk-200">Due Today</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading tasks...</div>}>
                <TaskClient
                  initialTasks={tasks}
                  initialProjects={projects}
                  mode="list"
                  variant="today"
                />
              </Suspense>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="bg-hunter_green-500 border-hunter_green-600 sticky top-4">
            <CardHeader>
              <CardTitle className="text-cornsilk-200">Add New Task</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskClient
                initialProjects={projects}
                mode="form"
                variant="today"
                prefilledTaskData={{
                  dueDate: new Date().toISOString() // Convert to ISO string
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}