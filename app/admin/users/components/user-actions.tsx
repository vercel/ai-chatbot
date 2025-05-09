'use client';

import { useState } from 'react';
import {
  MoreHorizontal,
  Key,
  Trash2,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/toast';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  type: 'regular' | 'guest';
}

interface UserActionsProps {
  user: User;
  onActionComplete?: () => void;
}

export function UserActions({ user, onActionComplete }: UserActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPwDialogOpen, setResetPwDialogOpen] = useState(false);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteUser = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/admin/api/users?id=${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      toast({
        type: 'success',
        description: `User ${user.email} deleted successfully.`,
      });

      // Refresh the user list
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        type: 'error',
        description:
          error instanceof Error ? error.message : 'Failed to delete user.',
      });
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/admin/api/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }

      toast({
        type: 'success',
        description: `Password reset email sent to ${user.email}.`,
      });

      // Refresh the user list
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        type: 'error',
        description:
          error instanceof Error ? error.message : 'Failed to reset password.',
      });
    } finally {
      setIsLoading(false);
      setResetPwDialogOpen(false);
    }
  };

  const handleChangeRole = async () => {
    try {
      setIsLoading(true);
      const newRole = user.role === 'admin' ? 'user' : 'admin';

      const response = await fetch(`/admin/api/users?id=${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change user role');
      }

      toast({
        type: 'success',
        description: `User ${user.email} role changed to ${newRole}.`,
      });

      // Refresh the user list
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      console.error('Error changing role:', error);
      toast({
        type: 'error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to change user role.',
      });
    } finally {
      setIsLoading(false);
      setChangeRoleDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setChangeRoleDialogOpen(true)}>
            {user.role === 'admin' ? (
              <>
                <ShieldX className="mr-2 h-4 w-4" />
                <span>Remove Admin</span>
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Make Admin</span>
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResetPwDialogOpen(true)}>
            <Key className="mr-2 h-4 w-4" />
            <span>Reset Password</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete User</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user{' '}
              <strong>{user.email}</strong> and all their data. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={resetPwDialogOpen} onOpenChange={setResetPwDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset User Password</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a password reset email to{' '}
              <strong>{user.email}</strong>. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Email'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Role Dialog */}
      <AlertDialog
        open={changeRoleDialogOpen}
        onOpenChange={setChangeRoleDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.role === 'admin' ? 'Remove Admin Role' : 'Grant Admin Role'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.role === 'admin'
                ? `This will remove admin privileges from ${user.email}. They will no longer have access to administrative features.`
                : `This will grant admin privileges to ${user.email}. They will have access to all administrative features including user management.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangeRole} disabled={isLoading}>
              {isLoading
                ? 'Updating...'
                : user.role === 'admin'
                  ? 'Remove Admin'
                  : 'Make Admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
