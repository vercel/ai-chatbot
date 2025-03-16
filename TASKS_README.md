# Tasks Feature Implementation

This document describes how to set up and use the new Tasks feature in the WIZZO application.

## Setup Instructions

1. **Install Required Dependencies**

   Run one of the following commands based on your package manager:

   ```bash
   # Using npm
   npm install react-day-picker @radix-ui/react-popover @radix-ui/react-toast @radix-ui/react-tabs date-fns

   # Using yarn
   yarn add react-day-picker @radix-ui/react-popover @radix-ui/react-toast @radix-ui/react-tabs date-fns
   ```

2. **Database Migration**

   Run the database migration to create the new task-related tables:

   ```bash
   npm run db:migrate
   ```

## Feature Overview

The Tasks feature is inspired by Todoist and provides the following functionality:

### Task Management
- Create, edit, and delete tasks
- Mark tasks as completed
- Set priority levels (P1, P2, P3, P4)
- Set due dates for tasks
- Add optional descriptions to tasks

### Project Organization
- Create and manage projects
- Assign different colors to projects
- Set a default project for tasks
- Move tasks between projects

### Views
- All Tasks: See all your tasks in one place
- Today: Focus on tasks due today
- Upcoming: Plan ahead with tasks due in the next 7 days
- Projects: Manage your task projects

## UI Components

The Tasks feature includes the following components:

- **TaskItem**: Displays an individual task with completion status, priority, and due date
- **TaskList**: Shows a filterable list of tasks
- **TaskForm**: Form for creating and editing tasks
- **ProjectForm**: Form for creating and editing projects
- **ProjectList**: Displays and manages projects

## API Endpoints

The following API endpoints are available for the Tasks feature:

### Tasks
- `GET /api/tasks` - Get all tasks for the current user
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/[id]` - Get a specific task
- `PATCH /api/tasks/[id]` - Update a task
- `DELETE /api/tasks/[id]` - Delete a task (soft delete)

### Projects
- `GET /api/tasks/projects` - Get all projects for the current user
- `POST /api/tasks/projects` - Create a new project
- `GET /api/tasks/projects/[id]` - Get a specific project
- `PATCH /api/tasks/projects/[id]` - Update a project
- `DELETE /api/tasks/projects/[id]` - Delete a project (soft delete)

## Usage Examples

### Creating a New Task

1. Navigate to the Tasks tab in the sidebar
2. Click on "Add Task" button
3. Fill in the task details (name, description, project, priority, due date)
4. Click "Add Task" to save

### Managing Projects

1. Navigate to Projects under the Tasks tab
2. View the list of existing projects
3. Click "Add New Project" to create a project
4. Use the action menu to edit or delete existing projects

## Notes

- The default project is created automatically when a user accesses the Tasks feature for the first time
- Deleting a project will move all its tasks to the default project
- Tasks are never permanently deleted but are soft-deleted and filtered out of queries
