'use client';

import { CheckCircle, Circle, Edit, Trash2, Calendar, Flag, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, isPast, format } from 'date-fns';
import { Task, Project, PRIORITY_INFO } from '@/lib/types/tasks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TaskTableProps {
  tasks: Task[];
  projects: Record<string, Project>;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskTable({ tasks, projects, onToggleComplete, onEdit, onDelete }: TaskTableProps) {
  // Priority icon and color
  const getPriorityDisplay = (priority: string) => {
    const priorityInfo = PRIORITY_INFO[priority as keyof typeof PRIORITY_INFO];
    
    return (
      <div className={cn("flex items-center", priorityInfo.color)}>
        <Flag className="mr-1 h-4 w-4" />
        <span className="hidden md:inline">{priority === 'p1' ? 'High' : priority === 'p2' ? 'Medium' : priority === 'p3' ? 'Low' : 'None'}</span>
      </div>
    );
  };
  
  // Format due date with highlighting for overdue
  const formatDueDate = (dueDate: string | null, completed: boolean) => {
    if (!dueDate) return null;
    
    const date = new Date(dueDate);
    const isOverdue = isPast(date) && !completed;
    
    return (
      <div className={cn(
        "flex items-center gap-1", 
        isOverdue ? "text-red-400" : "text-cornsilk-300"
      )}>
        <Calendar className="h-4 w-4" />
        <span className="whitespace-nowrap">
          {format(date, 'MMM d')}
          <span className="hidden md:inline ml-1">
            ({formatDistanceToNow(date, { addSuffix: true })})
          </span>
        </span>
      </div>
    );
  };

  return (
    <Table>
      <TableHeader className="bg-hunter_green-600">
        <TableRow>
          <TableHead className="w-[50px]">Status</TableHead>
          <TableHead>Task</TableHead>
          <TableHead className="hidden md:table-cell">Project</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow 
            key={task.id}
            className={cn(
              task.completed ? "opacity-60 hover:opacity-80" : "",
              "transition-all hover:bg-hunter_green-600/50"
            )}
          >
            <TableCell>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-8 w-8 p-0",
                  task.completed ? "text-green-500" : "text-cornsilk-300"
                )}
                onClick={() => onToggleComplete(task.id)}
              >
                {task.completed ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
                <span className="sr-only">
                  {task.completed ? "Mark as incomplete" : "Mark as complete"}
                </span>
              </Button>
            </TableCell>
            
            <TableCell className="font-medium">
              <div className={cn(
                task.completed ? "line-through text-cornsilk-400" : "text-cornsilk-200"
              )}>
                {task.content}
                {task.description && (
                  <p className="text-xs text-cornsilk-400 mt-1 line-clamp-1">{task.description}</p>
                )}
              </div>
            </TableCell>
            
            <TableCell className="hidden md:table-cell">
              {task.projectId && projects[task.projectId] && (
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1 border-hunter_green-600"
                >
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: projects[task.projectId].color }}
                  />
                  <span>{projects[task.projectId].name}</span>
                </Badge>
              )}
            </TableCell>
            
            <TableCell>{formatDueDate(task.dueDate, task.completed)}</TableCell>
            
            <TableCell>{getPriorityDisplay(task.priority)}</TableCell>
            
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 text-cornsilk-300 hover:text-cornsilk-100"
                  onClick={() => onEdit(task)}
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit task</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                  onClick={() => onDelete(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete task</span>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}