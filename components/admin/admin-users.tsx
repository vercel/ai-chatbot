'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  PlusIcon,
  MoreHorizontal,
  KeyIcon,
  ShieldIcon,
  TrashIcon,
  LoaderIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import dynamic from 'next/dynamic';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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

// Dynamic imports
const UserAddDialog = dynamic(() =>
  import('./user-add-dialog').then((mod) => ({ default: mod.UserAddDialog })),
);
const PasswordResetDialog = dynamic(() =>
  import('./password-reset-dialog').then((mod) => ({
    default: mod.PasswordResetDialog,
  })),
);

type User = {
  id: string;
  email: string;
  role: 'admin' | 'user';
  type?: 'guest' | 'regular';
};

export function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/admin/api/users');
      const data = await response.json();

      // Add type property to users if needed
      const usersWithType = data.map((user: User) => ({
        ...user,
        type: user.email.startsWith('guest-') ? 'guest' : 'regular',
      }));

      setUsers(usersWithType);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        type: 'error',
        description: 'Failed to load users. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (newUser: {
    email: string;
    role: string;
    password?: string;
  }) => {
    try {
      const response = await fetch('/admin/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      toast({
        type: 'success',
        description: 'User created successfully.',
      });

      // Refresh user list
      await fetchUsers();

      // Close dialog
      setIsAddUserDialogOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        type: 'error',
        description: 'Failed to create user. Please try again.',
      });
      // Re-throw the error so the form can handle it
      throw error;
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/admin/api/users?id=${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      // Remove the deleted user from the state
      setUsers(users.filter((u) => u.id !== selectedUser.id));

      toast({
        type: 'success',
        description: `User ${selectedUser.email} deleted successfully.`,
      });

      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        type: 'error',
        description:
          error instanceof Error ? error.message : 'Failed to delete user.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordOpen(true);
  };

  const resetUserPassword = async (userId: string) => {
    try {
      const response = await fetch('/admin/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }

      return await response.json();
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const handleToggleAdminRole = async (user: User) => {
    try {
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
        throw new Error(errorData.error || 'Failed to update user role');
      }

      // Update the user in the state
      setUsers(
        users.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
      );

      toast({
        type: 'success',
        description: `User ${user.email} ${newRole === 'admin' ? 'promoted to admin' : 'demoted to user'}.`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        type: 'error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update user role.',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-3"
          />
        </div>
        <Button onClick={() => setIsAddUserDialogOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoaderIcon className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === 'admin' ? 'default' : 'outline'}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.type === 'guest' ? 'secondary' : 'outline'
                        }
                      >
                        {user.type || 'regular'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleToggleAdminRole(user)}
                            className="cursor-pointer"
                          >
                            <ShieldIcon className="mr-2 h-4 w-4" />
                            {user.role === 'admin'
                              ? 'Revoke Admin'
                              : 'Promote to Admin'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleResetPassword(user)}
                            className="cursor-pointer"
                          >
                            <KeyIcon className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user)}
                            className="text-destructive cursor-pointer"
                          >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add User Dialog */}
      <UserAddDialog
        isOpen={isAddUserDialogOpen}
        onClose={() => setIsAddUserDialogOpen(false)}
        onAddUser={handleAddUser}
      />

      {/* Reset Password Dialog */}
      {selectedUser && (
        <PasswordResetDialog
          open={isResetPasswordOpen}
          onOpenChange={setIsResetPasswordOpen}
          user={{
            ...selectedUser,
            type: selectedUser.type || 'regular',
          }}
          onResetPassword={resetUserPassword}
        />
      )}

      {/* Delete User Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user account and remove all associated data, including chat
              history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-destructive text-destructive-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
