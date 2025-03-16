'use client';

import { useState } from 'react';
import { Project } from '@/lib/types/tasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// Available colors for projects
const PROJECT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#F97316', // Orange
];

interface ProjectFormProps {
  onSubmit: (data: Partial<Project>) => void;
  initialData?: Partial<Project>;
  isEditing?: boolean;
  isLoading?: boolean;
}

export function ProjectForm({ 
  onSubmit, 
  initialData = {}, 
  isEditing = false, 
  isLoading = false 
}: ProjectFormProps) {
  const [name, setName] = useState(initialData.name || '');
  const [color, setColor] = useState(initialData.color || PROJECT_COLORS[0]);
  const [isDefault, setIsDefault] = useState(initialData.isDefault || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    // Create project data
    onSubmit({
      name: name.trim(),
      color,
      isDefault,
      ...initialData, // Keep original id and other fields if editing
    });
    
    // Clear form if not editing
    if (!isEditing) {
      setName('');
      setColor(PROJECT_COLORS[0]);
      setIsDefault(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-cornsilk-300">
          Project Name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Enter project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border-hunter_green-600 focus:border-cornsilk-500 bg-hunter_green-600/50"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-medium text-cornsilk-300">
          Color
        </Label>
        <div className="flex flex-wrap gap-2">
          {PROJECT_COLORS.map((colorOption) => (
            <button
              key={colorOption}
              type="button"
              className={cn(
                "w-6 h-6 rounded-full transition-all",
                color === colorOption ? "ring-2 ring-cornsilk-300 ring-offset-2 ring-offset-hunter_green-500" : ""
              )}
              style={{ backgroundColor: colorOption }}
              onClick={() => setColor(colorOption)}
              aria-label={`Color: ${colorOption}`}
            />
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-2">
        <Label htmlFor="isDefault" className="text-sm font-medium text-cornsilk-300">
          Set as default project
        </Label>
        <Switch
          id="isDefault"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
        />
      </div>
      
      <div className="pt-4 border-t border-hunter_green-600 mt-6">
        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="bg-hunter_green-600 hover:bg-hunter_green-700"
            disabled={isLoading || !name.trim()}
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
              <>{isEditing ? 'Update Project' : 'Create Project'}</>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}