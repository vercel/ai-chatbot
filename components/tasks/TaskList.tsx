"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  CheckCircle, 
  Clock, 
  Edit, 
  MoreVertical, 
  Trash2, 
  AlertCircle,
  CircleDashed
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Task } from "@prisma/client";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type TaskListProps = {
  tasks: Task[];
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
};

export function TaskList({ tasks, onTaskUpdated, onTaskDeleted }: TaskListProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "IN_PROGRESS":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "STUCK":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <CircleDashed className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Completed";
      case "IN_PROGRESS":
        return "In Progress";
      case "STUCK":
        return "Stuck";
      default:
        return "Not Started";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return <Badge variant="destructive">High</Badge>;
      case "MEDIUM":
        return <Badge variant="default">Medium</Badge>;
      case "LOW":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        onTaskUpdated(updatedTask);
        toast.success("Task status updated successfully");
      } else {
        toast.error("Failed to update task status");
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("An error occurred while updating the task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onTaskDeleted(taskId);
        toast.success("Task deleted successfully");
      } else {
        toast.error("Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("An error occurred while deleting the task");
    }
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setIsEditOpen(true);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    onTaskUpdated(updatedTask);
    setIsEditOpen(false);
    setEditingTask(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <Card key={task.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">{task.title}</CardTitle>
                <CardDescription>
                  {task.createdAt && 
                    `Created ${formatDistanceToNow(new Date(task.createdAt))} ago`}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditClick(task)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteTask(task.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {task.description || "No description provided"}
              </p>
              
              {task.dueDate && (
                <div className="flex items-center mt-4 text-sm">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>
                    Due {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                  </span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <div className="flex items-center">
                {getStatusIcon(task.status)}
                <span className="ml-2 text-sm">{getStatusText(task.status)}</span>
              </div>
              {getPriorityBadge(task.priority)}
            </CardFooter>
            
            <div className="p-4 pt-0 border-t mt-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Update Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, "NOT_STARTED")}>
                    <CircleDashed className="mr-2 h-4 w-4 text-gray-500" />
                    Not Started
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, "IN_PROGRESS")}>
                    <Clock className="mr-2 h-4 w-4 text-blue-500" />
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, "STUCK")}>
                    <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                    Stuck
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, "COMPLETED")}>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Completed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>

      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
    </>
  );
}
