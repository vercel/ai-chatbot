'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserActions } from '@/app/admin/users/components/user-actions';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/components/toast';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  type: 'regular' | 'guest';
  createdAt?: string;
}

interface UserTableProps {
  filter: 'all' | 'admin' | 'user' | 'guest';
}

export default function UserTable({ filter }: UserTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/admin/api/users');

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();

      // Determine user type from email (guest users have email starting with guest-)
      const usersWithType = data.map(
        (user: Omit<User, 'type'> & { role: string }) => ({
          ...user,
          type: user.email.startsWith('guest-') ? 'guest' : 'regular',
          role: user.role as 'admin' | 'user',
        }),
      );

      setUsers(usersWithType);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        type: 'error',
        description: 'Failed to load users. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on the selected tab
  const filteredUsers = users.filter((user) => {
    if (filter === 'all') return true;
    if (filter === 'admin') return user.role === 'admin';
    if (filter === 'user')
      return user.role === 'user' && user.type === 'regular';
    if (filter === 'guest') return user.type === 'guest';
    return true;
  });

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading users...</p>;
  }

  if (filteredUsers.length === 0) {
    return <p className="text-sm text-muted-foreground">No users found.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={user.type === 'guest' ? 'secondary' : 'outline'}
                >
                  {user.type}
                </Badge>
              </TableCell>
              <TableCell>
                {user.createdAt
                  ? formatDistanceToNow(new Date(user.createdAt), {
                      addSuffix: true,
                    })
                  : 'Unknown'}
              </TableCell>
              <TableCell className="text-right">
                <UserActions user={user} onActionComplete={fetchUsers} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
