'use client';

import { useState, useMemo } from 'react';
import { TaskItem } from './task-item';
import { Task, Project } from '@/lib/types/tasks';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Check, X } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditTaskDialog } from './edit-task-dialog';
import { cn } from '@/lib/utils';

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  onUpdate: (id: string, data: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddTask?: () => void;
}

export function TaskList({ tasks, projects, onUpdate, onDelete, onAddTask }: TaskListProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate');
  const [filterByProject, setFilterByProject] = useState<string | 'all'>('all');
  
  // Memoized project lookup map
  const projectMap = useMemo(() => {
    return projects.reduce((acc, project) => {
      acc[project.id] = project;
      return acc;
    }, {} as Record<string, Project>);
  }, [projects]);
  
  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => showCompleted || !task.completed)
      .filter(task => filterByProject === 'all' || task.projectId === filterByProject)
      .sort((a, b) => {
        if (sortBy === 'dueDate') {
          // Sort by due date (null dates at the end)
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        } else if (sortBy === 'priority') {
          // Sort by priority (p1 > p2 > p3 > p4)
          const priorityValue = { p1: 0, p2: 1, p3: 2, p4: 3 };
          return (
            priorityValue[a.priority as keyof typeof priorityValue] - 
            priorityValue[b.priority as keyof typeof priorityValue]
          );
        } else {
          // Sort by created date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [tasks, showCompleted, filterByProject, sortBy]);
  
  const handleCloseEditDialog = () => {
    setEditingTask(null);
  };
  
  return (
    <div className="space-y-6">
      {/* Controls section */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 pb-4 border-b border-hunter_green-600">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            className={cn(
              "border-hunter_green-600",
              showCompleted ? "bg-hunter_green-600" : "bg-transparent"
            )}
          >
            {showCompleted ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            Show Completed
          </Button>
          
          {/* Sort dropdown */}
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as 'dueDate' | 'priority' | 'createdAt')}
          >
            <SelectTrigger className="w-[180px] bg-hunter_green-600/40 border-hunter_green-600">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-hunter_green-800 border-hunter_green-600">
              <SelectItem value="dueDate" className="text-cornsilk-200">Sort by Due Date</SelectItem>
              <SelectItem value="priority" className="text-cornsilk-200">Sort by Priority</SelectItem>
              <SelectItem value="createdAt" className="text-cornsilk-200">Sort by Created Date</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Project filter */}
          {projects.length > 0 && (
            <Select
              value={filterByProject}
              onValueChange={(value) => setFilterByProject(value)}
            >
              <SelectTrigger className="w-[180px] bg-hunter_green-600/40 border-hunter_green-600 hidden sm:flex">
                <SelectValue placeholder="Filter by Project" />
              </SelectTrigger>
              <SelectContent className="bg-hunter_green-800 border-hunter_green-600">
                <SelectItem value="all" className="text-cornsilk-200">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id} className="text-cornsilk-200">
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-2" 
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        {onAddTask && (
          <Button 
            onClick={onAddTask}
            className="bg-hunter_green-600 hover:bg-hunter_green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        )}
      </div>
      
      {/* Tasks grid */}
      {filteredTasks.length > 0 ? (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              project={projectMap[task.projectId]}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onEdit={(task) => setEditingTask(task)}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="bg-hunter_green-600/30 rounded-full p-4 mb-4">
            <Check className="h-8 w-8 text-cornsilk-400" />
          </div>
          <h3 className="text-lg font-medium text-cornsilk-300 mb-1">No tasks found</h3>
          <p className="text-cornsilk-400 mb-4 max-w-md">
            {showCompleted
              ? "You don't have any tasks matching your current filters."
              : "You've completed all your tasks! Add a new task to get started."}
          </p>
          {onAddTask && (
            <Button 
              onClick={onAddTask}
              className="bg-hunter_green-600 hover:bg-hunter_green-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Task
            </Button>
          )}
        </div>
      )}
      
      {/* Edit task dialog */}
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          projects={projects}
          open={!!editingTask}
          onClose={handleCloseEditDialog}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}