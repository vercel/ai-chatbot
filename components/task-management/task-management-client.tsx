'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TaskTable } from './task-table';
import { TaskDialog } from './task-dialog';
import { Task, Project } from '@/lib/types/tasks';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus, Filter, SortAsc, CheckCircle, Circle, RefreshCw } from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
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
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyTasksPlaceholder } from './empty-tasks-placeholder';

interface TaskManagementClientProps {
  initialTasks: Task[];
  initialProjects: Project[];
}

export function TaskManagementClient({ initialTasks, initialProjects }: TaskManagementClientProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterByProject, setFilterByProject] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate');

  // Get default project ID for new tasks
  const defaultProjectId = useMemo(() => {
    const defaultProject = projects.find(p => p.isDefault);
    return defaultProject?.id || (projects.length > 0 ? projects[0].id : '');
  }, [projects]);

  // Filter and sort tasks
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
          // Sort by creation date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [tasks, showCompleted, filterByProject, sortBy]);

  // Project lookup by ID
  const projectMap = useMemo(() => {
    return projects.reduce((acc, project) => {
      acc[project.id] = project;
      return acc;
    }, {} as Record<string, Project>);
  }, [projects]);

  // Task operations
  const handleCreateTask = async (data: Partial<Task>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          projectId: data.projectId || defaultProjectId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create task');
      }

      const newTask = await response.json();
      setTasks([...tasks, newTask]);
      setShowDialog(false);
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
      
      if (selectedTask?.id === id) {
        setSelectedTask(updatedTask);
      }
      
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
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

      // Close dialog if the deleted task was selected
      if (selectedTask?.id === id) {
        setSelectedTask(null);
        setShowDialog(false);
      }
      
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    await handleUpdateTask(id, { completed: !task.completed });
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowDialog(true);
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setShowDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card className="bg-hunter_green-500 border-hunter_green-600">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Project filter */}
              <Select value={filterByProject} onValueChange={setFilterByProject}>
                <SelectTrigger className="w-[180px] border-hunter_green-600 bg-hunter_green-600/50">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent className="bg-hunter_green-800 border-hunter_green-600">
                  <SelectItem value="all" className="text-cornsilk-200">All Projects</SelectItem>
                  {projects.map(project => (
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
              
              {/* Sort options */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-[180px] border-hunter_green-600 bg-hunter_green-600/50">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className="bg-hunter_green-800 border-hunter_green-600">
                  <SelectItem value="dueDate" className="text-cornsilk-200">Due Date</SelectItem>
                  <SelectItem value="priority" className="text-cornsilk-200">Priority</SelectItem>
                  <SelectItem value="createdAt" className="text-cornsilk-200">Date Created</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Show/hide completed */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-hunter_green-600 bg-hunter_green-600/50">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-hunter_green-800 border-hunter_green-600">
                  <DropdownMenuCheckboxItem
                    checked={showCompleted}
                    onCheckedChange={setShowCompleted}
                    className="text-cornsilk-200"
                  >
                    Show Completed Tasks
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="border-hunter_green-600 bg-hunter_green-600/50"
                onClick={() => router.refresh()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            <Button 
              className="bg-hunter_green-700 hover:bg-hunter_green-800 text-cornsilk-100"
              onClick={handleAddTask}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks table or empty state */}
      {filteredTasks.length > 0 ? (
        <Card className="bg-hunter_green-500 border-hunter_green-600">
          <CardContent className="p-0">
            <TaskTable
              tasks={filteredTasks}
              projects={projectMap}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          </CardContent>
        </Card>
      ) : (
        <EmptyTasksPlaceholder onAddTask={handleAddTask} />
      )}
      
      {/* Task dialog for add/edit */}
      <TaskDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        task={selectedTask}
        projects={projects}
        isLoading={isLoading}
        onSubmit={selectedTask ? 
          (data) => handleUpdateTask(selectedTask.id, data) : 
          handleCreateTask
        }
      />
    </div>
  );
}