'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TaskList } from './task-list';
import { TaskForm } from './task-form';
import { Project, Task } from '@/lib/types/tasks';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface TaskClientProps {
  initialTasks?: Task[];
  initialProjects?: Project[];
  mode?: 'list' | 'form' | 'both';
  variant?: 'all' | 'today' | 'upcoming';
  prefilledTaskData?: Partial<Task>;
}

export function TaskClient({ 
  initialTasks = [], 
  initialProjects = [], 
  mode = 'both',
  variant = 'all',
  prefilledTaskData = {}
}: TaskClientProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isLoading, setIsLoading] = useState(false);
  const [showTaskSheet, setShowTaskSheet] = useState(false);

  // Load initial data
  useEffect(() => {
    if (initialTasks?.length > 0 || initialTasks?.length === 0) {
      setTasks(initialTasks);
    }
    if (initialProjects?.length > 0 || initialProjects?.length === 0) {
      setProjects(initialProjects);
    }
  }, [initialTasks, initialProjects]);

  // Ensure dates are handled as strings
  const safePrefilledData = {
    ...prefilledTaskData,
    dueDate: typeof prefilledTaskData.dueDate === 'object' && prefilledTaskData.dueDate instanceof Date 
      ? prefilledTaskData.dueDate.toISOString()
      : prefilledTaskData.dueDate
  };

  // Task operations
  const handleCreateTask = async (data: Partial<Task>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create task');
      }

      const newTask = await response.json();
      setTasks([...tasks, newTask]);
      setShowTaskSheet(false);
      toast.success('Task created successfully');
      
      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (id: string, data: Partial<Task>) => {
    setIsLoading(true);
    try {
      // Optimistic update
      const existingTask = tasks.find(task => task.id === id);
      if (!existingTask) {
        throw new Error('Task not found');
      }
      
      const optimisticTask = { ...existingTask, ...data };
      setTasks(tasks.map(task => task.id === id ? optimisticTask : task));
      
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Revert optimistic update
        setTasks(tasks);
        const error = await response.json();
        throw new Error(error.error || 'Failed to update task');
      }

      const updatedTask = await response.json();
      setTasks(tasks.map(task => task.id === id ? updatedTask : task));
      toast.success('Task updated successfully');
      
      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setIsLoading(true);
    try {
      // Optimistic delete
      setTasks(tasks.filter(task => task.id !== id));
      
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Revert optimistic delete
        setTasks(tasks);
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete task');
      }

      toast.success('Task deleted successfully');
      
      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {(mode === 'list' || mode === 'both') && (
        <TaskList
          tasks={tasks}
          projects={projects}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          onAddTask={() => setShowTaskSheet(true)}
        />
      )}
      
      {mode === 'form' && (
        <TaskForm
          projects={projects}
          onSubmit={handleCreateTask}
          initialData={safePrefilledData}
          isLoading={isLoading}
        />
      )}
      
      {/* Task creation sheet */}
      <Sheet open={showTaskSheet} onOpenChange={setShowTaskSheet}>
        <SheetContent side="right" className="sm:max-w-md bg-hunter_green-500 border-hunter_green-600">
          <SheetHeader>
            <SheetTitle className="text-cornsilk-200">Create New Task</SheetTitle>
            <SheetDescription className="text-cornsilk-400">
              Add a new task to your list. Fill in the details and click 'Add Task'.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <TaskForm
              projects={projects}
              onSubmit={handleCreateTask}
              initialData={safePrefilledData}
              isLoading={isLoading}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}