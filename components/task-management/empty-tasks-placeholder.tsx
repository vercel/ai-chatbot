'use client';

import { CheckSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyTasksPlaceholderProps {
  onAddTask: () => void;
}

export function EmptyTasksPlaceholder({ onAddTask }: EmptyTasksPlaceholderProps) {
  return (
    <Card className="bg-hunter_green-500 border-hunter_green-600">
      <CardContent className="flex flex-col items-center justify-center text-center p-12">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-hunter_green-600 rounded-full opacity-20 animate-ping"></div>
          <div className="relative flex items-center justify-center w-20 h-20 bg-hunter_green-600 rounded-full">
            <CheckSquare className="h-10 w-10 text-cornsilk-300" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-cornsilk-200 mb-2">No Tasks Found</h3>
        
        <p className="text-cornsilk-400 mb-6 max-w-md">
          You don't have any tasks yet. Get started by creating your first task to track your progress and stay organized.
        </p>
        
        <Button 
          className="bg-hunter_green-700 hover:bg-hunter_green-800 text-cornsilk-100"
          onClick={onAddTask}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Task
        </Button>
      </CardContent>
    </Card>
  );
}