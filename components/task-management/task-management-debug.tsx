'use client';

import { Task, Project } from '@/lib/types/tasks';
import { TaskManagementClient } from './task-management-client';
import { useEffect, useState } from 'react';

/**
 * Debug wrapper for TaskManagementClient that provides mock data
 * when no tasks or projects are available
 */
export function TaskManagementDebug({ 
  initialTasks = [], 
  initialProjects = [] 
}: { 
  initialTasks?: Task[], 
  initialProjects?: Project[] 
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMockData = async () => {
      setLoading(true);
      
      // Create default mock data
      const defaultProjects = [
        {
          id: 'p1',
          name: 'Inbox',
          color: '#3B82F6',
          isDefault: true,
          isDeleted: false,
          userId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'p2',
          name: 'Personal',
          color: '#10B981',
          isDefault: false,
          isDeleted: false,
          userId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      const defaultTasks = [
        {
          id: 't1',
          content: 'Fix UI layout issues',
          description: 'Address sidebar and content width problems',
          priority: 'p1',
          projectId: 'p1',
          completed: false,
          isDeleted: false,
          userId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 't2',
          content: 'Implement task management features',
          description: 'Complete the core functionality',
          priority: 'p2',
          projectId: 'p2',
          completed: false,
          isDeleted: false,
          userId: 'user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      // Check if we already have data
      if (initialTasks.length > 0 && initialProjects.length > 0) {
        console.log('Using provided data:', { tasks: initialTasks, projects: initialProjects });
        setTasks(initialTasks);
        setProjects(initialProjects);
        setLoading(false);
        return;
      }
      
      try {
        // Try to get mock data from localStorage
        const mockProjects = localStorage.getItem('debug_taskProjects');
        const mockTasks = localStorage.getItem('debug_taskItems');
        
        if (mockProjects && mockTasks) {
          const parsedProjects = JSON.parse(mockProjects);
          const parsedTasks = JSON.parse(mockTasks);
          
          console.log('Using mock data from localStorage:', { 
            tasks: parsedTasks, 
            projects: parsedProjects 
          });
          
          setTasks(parsedTasks);
          setProjects(parsedProjects);
        } else {
          // Use default mock data
          console.log('Using default mock data');
          setTasks(defaultTasks);
          setProjects(defaultProjects);
          
          // Save to localStorage for future use
          localStorage.setItem('debug_taskProjects', JSON.stringify(defaultProjects));
          localStorage.setItem('debug_taskItems', JSON.stringify(defaultTasks));
        }
      } catch (error) {
        console.error('Error loading mock data:', error);
        // Fallback to default mock data
        setTasks(defaultTasks);
        setProjects(defaultProjects);
      } finally {
        setLoading(false);
      }
    };
    
    loadMockData();
  }, [initialTasks, initialProjects]);
  
  if (loading) {
    return <div className="p-6 text-center">Loading tasks and projects...</div>;
  }
  
  // Show a debug message if we're using mock data
  const usingMockData = initialTasks.length === 0 || initialProjects.length === 0;
  
  return (
    <>
      {usingMockData && (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-md">
          <p className="text-yellow-600 dark:text-yellow-400 font-medium">
            Debug Mode: Using mock data for task management components. 
            <span className="block mt-1 text-sm">
              Run <code>window.setupTaskMockData()</code> in the browser console to refresh mock data.
            </span>
          </p>
        </div>
      )}
      
      <TaskManagementClient 
        initialTasks={tasks} 
        initialProjects={projects} 
      />
    </>
  );
}
