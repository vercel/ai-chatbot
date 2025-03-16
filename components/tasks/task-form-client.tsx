'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TaskForm } from './task-form';
import { TaskItem, TaskProject } from '@/lib/db/schema';
import { toast } from 'sonner';

interface TaskFormClientProps {
  projects: TaskProject[];
  initialData?: Partial<TaskItem>;
}

export function TaskFormClient({ projects, initialData = {} }: TaskFormClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateTask = async (data: Partial<TaskItem>) => {
    setIsLoading(true);
    try {
      // Convert date to ISO string format if it exists
      const taskData = {
        ...data,
        dueDate: data.dueDate ? (data.dueDate instanceof Date ? data.dueDate.toISOString() : data.dueDate) : null,
      };
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create task');
      }

      toast.success('Task created successfully');
      
      // Clear form by refreshing the page
      router.refresh();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TaskForm 
      projects={projects} 
      onSubmit={handleCreateTask}
      initialData={initialData}
      isLoading={isLoading}
    />
  );
}
