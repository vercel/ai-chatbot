'use client';

import { useState } from 'react';
import { Task, Project } from '@/lib/types/tasks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { TaskForm } from './task-form';
import { Button } from '@/components/ui/button';

interface EditTaskDialogProps {
  task: Task;
  projects: Project[];
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Task>) => Promise<void>;
}

export function EditTaskDialog({ task, projects, open, onClose, onUpdate }: EditTaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: Partial<Task>) => {
    setIsLoading(true);
    try {
      await onUpdate(task.id, data);
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-hunter_green-500 border-hunter_green-600">
        <DialogHeader>
          <DialogTitle className="text-cornsilk-200">Edit Task</DialogTitle>
          <DialogDescription className="text-cornsilk-400">
            Make changes to your task here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <TaskForm
          initialData={task}
          projects={projects}
          onSubmit={handleSubmit}
          isEditing={true}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}