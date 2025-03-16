import { redirect } from 'next/navigation';

export default function TasksRedirectPage() {
  // Redirect to the new task management page
  redirect('/task-management');
}