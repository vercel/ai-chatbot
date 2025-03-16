'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectForm } from './project-form';
import { TaskProject } from '@/lib/db/schema';
import { toast } from 'sonner';

interface ProjectFormClientProps {
  initialData?: Partial<TaskProject>;
}

export function ProjectFormClient({ initialData = {} }: ProjectFormClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateProject = async (data: Partial<TaskProject>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tasks/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create project');
      }

      toast.success('Project created successfully');
      
      // Clear form by refreshing the page
      router.refresh();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProjectForm 
      onSubmit={handleCreateProject}
      initialData={initialData}
      isLoading={isLoading}
    />
  );
}
