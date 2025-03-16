'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { Task, Project, PRIORITY_INFO } from '@/lib/types/tasks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  projects: Project[];
  isLoading: boolean;
  onSubmit: (data: Partial<Task>) => Promise<void>;
}

export function TaskDialog({ 
  open, 
  onOpenChange, 
  task, 
  projects, 
  isLoading, 
  onSubmit 
}: TaskDialogProps) {
  const [content, setContent] = useState(task?.content || '');
  const [description, setDescription] = useState(task?.description || '');
  const [projectId, setProjectId] = useState(task?.projectId || (projects.length > 0 ? projects[0].id : ''));
  const [priority, setPriority] = useState<'p1' | 'p2' | 'p3' | 'p4'>(task?.priority as 'p1' | 'p2' | 'p3' | 'p4' || 'p4');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task?.dueDate ? new Date(task.dueDate) : undefined
  );
  
  // Update form when task changes
  useEffect(() => {
    if (task) {
      setContent(task.content || '');
      setDescription(task.description || '');
      setProjectId(task.projectId || '');
      setPriority(task.priority as 'p1' | 'p2' | 'p3' | 'p4');
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    } else {
      // Clear form for new task
      setContent('');
      setDescription('');
      setProjectId(projects.length > 0 ? projects[0].id : '');
      setPriority('p4');
      setDueDate(undefined);
    }
  }, [task, projects]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    // Create task data
    const taskData: Partial<Task> = {
      content: content.trim(),
      description: description.trim() || null,
      projectId,
      priority,
      dueDate: dueDate ? dueDate.toISOString() : null,
    };
    
    await onSubmit(taskData);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-hunter_green-500 border-hunter_green-600">
        <DialogHeader>
          <DialogTitle className="text-cornsilk-200">
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription className="text-cornsilk-400">
            {task ? 'Make changes to your task here.' : 'Add a new task to your list.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-cornsilk-300">
                Task Title <span className="text-red-400">*</span>
              </Label>
              <Input
                id="title"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What needs to be done?"
                className="border-hunter_green-600 bg-hunter_green-600/50"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-cornsilk-300">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about this task..."
                className="resize-none min-h-[100px] border-hunter_green-600 bg-hunter_green-600/50"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project" className="text-cornsilk-300">Project</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger 
                    id="project"
                    className="border-hunter_green-600 bg-hunter_green-600/50"
                  >
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent className="bg-hunter_green-800 border-hunter_green-600">
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id} className="text-cornsilk-200">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: project.color }}
                          />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-cornsilk-300">Priority</Label>
                <Select 
                  id="priority"
                  value={priority} 
                  onValueChange={(value) => setPriority(value as 'p1' | 'p2' | 'p3' | 'p4')}
                >
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
                <Label htmlFor="due-date" className="text-cornsilk-300">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="due-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-hunter_green-600 bg-hunter_green-600/50",
                        !dueDate && "text-cornsilk-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'PPP') : <span>No due date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-hunter_green-800 border-hunter_green-600">
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
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-hunter_green-600 bg-hunter_green-600/50"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-hunter_green-700 hover:bg-hunter_green-800"
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
              ) : task ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}