// lib/types/tasks.ts

/**
 * Task interface aligned with the database schema
 */
export interface Task {
  id: string;
  userId: string;
  projectId: string;
  content: string;           // Task title
  description: string | null;
  completed: boolean;
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  dueDate: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Project interface aligned with the database schema
 */
export interface Project {
  id: string;
  userId: string;
  name: string;
  color: string;
  isDefault: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Priority types
 */
export type TaskPriority = 'p1' | 'p2' | 'p3' | 'p4';

/**
 * Priority display information
 */
export const PRIORITY_INFO = {
  p1: { 
    label: 'Priority 1 (Urgent)', 
    color: 'text-red-500',
    bgColor: 'bg-red-500',
    description: 'Urgent tasks that need immediate attention'
  },
  p2: { 
    label: 'Priority 2 (High)', 
    color: 'text-orange-500',
    bgColor: 'bg-orange-500',
    description: 'Important tasks with approaching deadlines'
  },
  p3: { 
    label: 'Priority 3 (Medium)', 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    description: 'Standard tasks with normal priority'
  },
  p4: { 
    label: 'Priority 4 (Low)', 
    color: 'text-gray-400',
    bgColor: 'bg-gray-400',
    description: 'Low priority tasks with flexible deadlines'
  }
};