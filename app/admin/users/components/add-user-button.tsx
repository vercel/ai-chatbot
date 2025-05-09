'use client';

import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from '@/components/toast';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters.' }),
  role: z.enum(['user', 'admin'], {
    required_error: 'Please select a role.',
  }),
});

export function AddUserButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [isTestPostLoading, setIsTestPostLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'user',
    },
  });

  // Function to test admin permissions
  const testAdminPermissions = async () => {
    setIsTestLoading(true);
    try {
      const response = await fetch('/api/admin-check');
      const data = await response.json();
      console.log('Admin check results:', data);

      toast({
        type: data.isAdmin ? 'success' : 'error',
        description: data.isAdmin
          ? 'You have admin permissions!'
          : 'You do NOT have admin permissions!',
      });
    } catch (error) {
      console.error('Failed to check admin permissions:', error);
      toast({
        type: 'error',
        description: 'Failed to check admin permissions',
      });
    } finally {
      setIsTestLoading(false);
    }
  };

  // Direct test POST function
  const testDirectPost = async () => {
    setIsTestPostLoading(true);
    try {
      // Create a test user with timestamp to avoid duplication
      const timestamp = new Date().getTime();
      const testData = {
        email: `test-${timestamp}@example.com`,
        password: 'password12345',
        role: 'user',
      };

      console.log('Test POST with data:', testData);

      const response = await fetch('/admin/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
        credentials: 'include', // Include cookies for auth
      });

      console.log('Test POST response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Test POST error response:', errorText);

        toast({
          type: 'error',
          description: `Test POST failed with status ${response.status}`,
        });
      } else {
        const data = await response.json();
        console.log('Test POST success response:', data);

        toast({
          type: 'success',
          description: `Test user created: ${data.email}`,
        });

        // Refresh the page
        router.refresh();
      }
    } catch (error) {
      console.error('Test POST error:', error);
      toast({
        type: 'error',
        description: 'Failed to make test POST request',
      });
    } finally {
      setIsTestPostLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log('Form submitted with values:', values);
    try {
      setIsLoading(true);
      console.log('Making POST request to /admin/api/users');

      // Add a simple test to see if fetch itself is working
      try {
        const testResponse = await fetch('/api/health-check');
        console.log('Test fetch response:', testResponse.ok);
      } catch (testError) {
        console.error('Test fetch failed:', testError);
      }

      const response = await fetch('/admin/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
        credentials: 'include', // Include cookies for auth
      });

      console.log('POST response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);

        let errorData: { error?: string } = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error('Failed to parse error response as JSON:', e);
        }

        throw new Error(
          errorData?.error || `Request failed with status ${response.status}`,
        );
      }

      const newUser = await response.json();
      console.log('Successfully created user:', newUser);

      toast({
        type: 'success',
        description: `User ${newUser.email} created successfully.`,
      });
      form.reset();
      setOpen(false);

      // Refresh the page to show the new user
      console.log('Refreshing page...');
      router.refresh();
    } catch (error) {
      console.error('Error creating user (full error):', error);
      toast({
        type: 'error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to create user. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={testAdminPermissions}
        disabled={isTestLoading}
      >
        {isTestLoading ? 'Checking...' : 'Check Admin Permissions'}
      </Button>

      <Button
        variant="outline"
        onClick={testDirectPost}
        disabled={isTestPostLoading}
      >
        {isTestPostLoading ? 'Testing...' : 'Test Direct POST'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. The user will receive an email with
              login instructions.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
