'use client';

import { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Calendar, 
  Flag,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Task, Project, PRIORITY_INFO } from '@/lib/types/tasks';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface TaskItemProps {
  task: Task;
  project?: Project;
  onUpdate: (id: string, data: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (task: Task) => void;
}

export function TaskItem({ task, project, onUpdate, onDelete, onEdit }: TaskItemProps) {
  const [isLoading, setIsLoading] = useState(false);

  const toggleComplete = async () => {
    setIsLoading(true);
    try {
      await onUpdate(task.id, { completed: !task.completed });
      toast.success(task.completed ? 'Task marked as incomplete' : 'Task completed!');
    } catch (error) {
      toast.error('Failed to update task status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    setIsLoading(true);
    try {
      await onDelete(task.id);
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
    } finally {
      setIsLoading(false);
    }
  };

  // Format the due date display
  const formatDueDate = () => {
    if (!task.dueDate) return null;
    
    const date = new Date(task.dueDate);
    const isOverdue = isPast(date) && !task.completed;
    
    return (
      <div className={cn(
        "flex items-center text-sm", 
        isOverdue ? "text-red-500" : "text-cornsilk-300"
      )}>
        <Calendar className="mr-2 h-4 w-4" />
        <span>
          {isOverdue ? 'Overdue: ' : 'Due: '}
          {formatDistanceToNow(date, { addSuffix: true })}
        </span>
      </div>
    );
  };

  // Get the priority icon and styling
  const getPriorityDisplay = () => {
    const priorityInfo = PRIORITY_INFO[task.priority as keyof typeof PRIORITY_INFO];
    
    return (
      <div className={cn("flex items-center text-sm", priorityInfo.color)}>
        <Flag className="mr-1 h-4 w-4" />
        <span className="hidden sm:inline">{priorityInfo.label}</span>
      </div>
    );
  };
  
  return (
    <div className={cn(
      "group p-4 rounded-lg border transition-all",
      task.completed 
        ? "border-hunter_green-600 bg-hunter_green-700/20" 
        : "border-hunter_green-600 bg-hunter_green-500 hover:shadow-md"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Completion toggle button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "h-6 w-6 rounded-full p-0 flex-shrink-0 mt-0.5",
              task.completed ? "text-green-500" : "text-cornsilk-300"
            )}
            onClick={toggleComplete}
            disabled={isLoading}
          >
            {task.completed ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
            <span className="sr-only">
              {task.completed ? "Mark as incomplete" : "Mark as complete"}
            </span>
          </Button>
          
          {/* Task content */}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "text-base font-medium truncate",
              task.completed ? "text-cornsilk-400 line-through" : "text-cornsilk-200"
            )}>
              {task.content}
            </h3>
            
            {task.description && (
              <p className={cn(
                "text-sm mt-1 line-clamp-2",
                task.completed ? "text-cornsilk-500" : "text-cornsilk-300"
              )}>
                {task.description}
              </p>
            )}
            
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              {/* Project badge */}
              {project && (
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1 border-hunter_green-600"
                >
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: project.color }}
                  />
                  <span>{project.name}</span>
                </Badge>
              )}
              
              {/* Due date display */}
              {formatDueDate()}
            </div>
          </div>
        </div>
        
        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 opacity-70 hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-hunter_green-800 border-hunter_green-600">
            <DropdownMenuLabel className="text-cornsilk-300">Task Actions</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-hunter_green-600" />
            <DropdownMenuItem 
              className="flex items-center cursor-pointer text-cornsilk-200 focus:text-cornsilk-100"
              onClick={() => onEdit(task)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center cursor-pointer text-red-500 focus:text-red-400"
              onClick={handleDeleteClick}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Priority indicator */}
      <div className="mt-3 pt-3 border-t border-hunter_green-600 flex justify-between items-center">
        {getPriorityDisplay()}
        
        {task.createdAt && (
          <span className="text-xs text-cornsilk-400">
            Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
          </span>
        )}
      </div>
    </div>
  );
}