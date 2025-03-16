'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Task, Project, PRIORITY_INFO } from '@/lib/types/tasks';
import { format } from 'date-fns';

interface TaskFormProps {
  projects: Project[];
  onSubmit: (data: Partial<Task>) => void;
  initialData?: Partial<Task>;
  isEditing?: boolean;
  isLoading?: boolean;
}

export function TaskForm({ 
  projects = [], 
  onSubmit, 
  initialData = {}, 
  isEditing = false, 
  isLoading = false 
}: TaskFormProps) {
  const [content, setContent] = useState(initialData.content || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [projectId, setProjectId] = useState(
    initialData.projectId || (projects.length > 0 ? projects[0].id : '')
  );
  const [priority, setPriority] = useState<'p1' | 'p2' | 'p3' | 'p4'>(
    initialData.priority as 'p1' | 'p2' | 'p3' | 'p4' || 'p4'
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(
    initialData.dueDate ? new Date(initialData.dueDate) : undefined
  );
  
  // Update form when initialData changes (e.g., when editing a different task)
  useEffect(() => {
    if (initialData) {
      setContent(initialData.content || '');
      setDescription(initialData.description || '');
      setProjectId(initialData.projectId || (projects.length > 0 ? projects[0].id : ''));
      setPriority(initialData.priority as 'p1' | 'p2' | 'p3' | 'p4' || 'p4');
      setDueDate(initialData.dueDate ? new Date(initialData.dueDate) : undefined);
    }
  }, [initialData, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    // Create task data object
    const taskData: Partial<Task> = {
      content: content.trim(),
      description: description.trim() || null,
      projectId,
      priority,
      dueDate: dueDate ? dueDate.toISOString() : null,
    };
    
    onSubmit(taskData);
    
    // Clear form if not editing
    if (!isEditing) {
      setContent('');
      setDescription('');
      setPriority('p4');
      setDueDate(undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-cornsilk-300">Task Name <span className="text-red-400">*</span></label>
        <Input
          placeholder="What needs to be done?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border-hunter_green-600 focus:border-cornsilk-500 bg-hunter_green-600/50"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-cornsilk-300">Description (optional)</label>
        <Textarea
          placeholder="Add more details about this task..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="resize-none border-hunter_green-600 focus:border-cornsilk-500 bg-hunter_green-600/50"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-cornsilk-300">Project</label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="border-hunter_green-600 bg-hunter_green-600/50">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent className="bg-hunter_green-800 border-hunter_green-600">
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id} className="text-cornsilk-200">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: project.color }}
                    ></div>
                    {project.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-cornsilk-300">Priority</label>
          <Select value={priority} onValueChange={(value: string) => setPriority(value as 'p1' | 'p2' | 'p3' | 'p4')}>
            <SelectTrigger className="border-hunter_green-600 bg-hunter_green-600/50">
              <SelectValue placeholder="Set priority" />
            </SelectTrigger>
            <SelectContent className="bg-hunter_green-800 border-hunter_green-600">
              {Object.entries(PRIORITY_INFO).map(([key, info]) => (
                <SelectItem key={key} value={key} className={info.color}>
                  <div className="flex items-center">
                    <Flag className="mr-2 h-4 w-4" />
                    {info.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-cornsilk-300">Due Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal border-hunter_green-600 bg-hunter_green-600/50",
                  !dueDate && "text-cornsilk-300"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-hunter_green-800 border-hunter_green-600" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
                classNames={{
                  day_today: "bg-hunter_green-600 text-cornsilk-100",
                  day_selected: "bg-cornsilk-500 text-hunter_green-900 hover:bg-cornsilk-400 hover:text-hunter_green-900 focus:bg-cornsilk-500 focus:text-hunter_green-900",
                }}
              />
              {dueDate && (
                <div className="p-3 border-t border-hunter_green-600 flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setDueDate(undefined)}
                    className="text-cornsilk-300 hover:text-cornsilk-100"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="pt-4 border-t border-hunter_green-600 mt-6">
        <div className="flex justify-between items-center">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => {
              if (isEditing) {
                // Cancel editing
              } else {
                // Clear form
                setContent('');
                setDescription('');
                setPriority('p4');
                setDueDate(undefined);
              }
            }}
            className="text-cornsilk-300 hover:text-cornsilk-100"
          >
            {isEditing ? 'Cancel' : 'Clear'}
          </Button>
          
          <Button 
            type="submit" 
            className="bg-hunter_green-600 hover:bg-hunter_green-700"
            disabled={isLoading || !content.trim()}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>{isEditing ? 'Update Task' : 'Add Task'}</>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}