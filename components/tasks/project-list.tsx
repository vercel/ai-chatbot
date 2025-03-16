'use client';

import { useState } from 'react';
import { Project } from '@/lib/types/tasks';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectForm } from './project-form';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProjectListProps {
  projects: Project[];
  onUpdate: (id: string, data: Partial<Project>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ProjectList({ projects, onUpdate, onDelete }: ProjectListProps) {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEditClick = (project: Project) => {
    setEditingProject(project);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProject = async (data: Partial<Project>) => {
    if (!editingProject) return;
    
    setIsLoading(true);
    try {
      await onUpdate(editingProject.id, data);
      setIsEditDialogOpen(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error updating project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? All its tasks will be moved to your default project.')) return;
    
    setIsLoading(true);
    try {
      await onDelete(projectId);
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div 
          key={project.id} 
          className={cn(
            "p-4 rounded-lg border transition-all",
            "border-hunter_green-600 bg-hunter_green-500 hover:shadow-md"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: project.color }}
              />
              <div>
                <h3 className="text-base font-medium text-cornsilk-200">
                  {project.name} {project.isDefault && <span className="text-sm text-cornsilk-400">(Default)</span>}
                </h3>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 opacity-70 hover:opacity-100"
                  disabled={isLoading}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Project actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-hunter_green-800 border-hunter_green-600">
                <DropdownMenuItem 
                  className="flex items-center cursor-pointer text-cornsilk-200 focus:text-cornsilk-100"
                  onClick={() => handleEditClick(project)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Project
                </DropdownMenuItem>
                {!project.isDefault && (
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer text-red-500 focus:text-red-400"
                    onClick={() => handleDeleteClick(project.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
      
      {/* Edit project dialog */}
      {editingProject && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-hunter_green-500 border-hunter_green-600">
            <DialogHeader>
              <DialogTitle className="text-cornsilk-200">Edit Project</DialogTitle>
              <DialogDescription className="text-cornsilk-400">
                Make changes to your project here.
              </DialogDescription>
            </DialogHeader>
            
            <ProjectForm
              initialData={editingProject}
              onSubmit={handleUpdateProject}
              isEditing={true}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      )}
      
      {projects.length === 0 && (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="bg-hunter_green-600/30 rounded-full p-4 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cornsilk-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-cornsilk-300 mb-1">No projects found</h3>
          <p className="text-cornsilk-400 mb-4 max-w-md">
            You don't have any projects yet. Create your first project to organize your tasks.
          </p>
        </div>
      )}
    </div>
  );
}