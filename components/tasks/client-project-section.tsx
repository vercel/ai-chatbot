'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '@/lib/types/tasks';
import { ProjectList } from './project-list';
import { ProjectForm } from './project-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface ClientProjectSectionProps {
  initialProjects: Project[];
}

export function ClientProjectSection({ initialProjects }: ClientProjectSectionProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateProject = async (id: string, data: Partial<Project>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update project');
      }

      const updatedProject = await response.json();
      
      // Update projects list
      setProjects(prev => 
        prev.map(project => project.id === id ? { ...project, ...updatedProject } : project)
      );
      
      toast.success('Project updated successfully');
      router.refresh();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/projects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete project');
      }

      // Remove from projects list
      setProjects(prev => prev.filter(project => project.id !== id));
      
      toast.success('Project deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (data: Partial<Project>) => {
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

      const newProject = await response.json();
      
      // Add to projects list
      setProjects(prev => [...prev, newProject]);
      
      toast.success('Project created successfully');
      router.refresh();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <ProjectList
          projects={projects}
          onUpdate={handleUpdateProject}
          onDelete={handleDeleteProject}
        />
      </div>
      
      <div>
        <Card className="bg-hunter_green-500 border-hunter_green-600 sticky top-4">
          <CardHeader>
            <CardTitle className="text-cornsilk-200">Create New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectForm
              onSubmit={handleCreateProject}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}