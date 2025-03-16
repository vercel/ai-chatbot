'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TaskForm } from './task-form';
import { Project, Task } from '@/lib/types/tasks';
import { toast } from 'sonner';

interface ClientTaskFormProps {
  projects: Project[];
  initialData?: Partial<Task>;
}

export function ClientTaskForm({ projects, initialData = {} }: ClientTaskFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: Partial<Task>) => {
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

      toast.success('Task created successfully');
      
      // Redirect to tasks page
      router.push('/tasks');
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
      onSubmit={handleSubmit}
      initialData={initialData}
      isLoading={isLoading}
    />
  );
}