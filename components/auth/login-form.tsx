'use client';

import { useAction } from 'next-safe-action/hooks';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';

import { TriangleAlertIcon as IconWarning, LoaderIcon } from 'lucide-react';
import { CheckCircleFillIcon as IconCheckCircle } from '@/components/icons';
import { Alert, AlertTitle } from '../ui/alert';

import { SignInSchema, SignIn } from '@/lib/validators';
import { login } from '@/app/(auth)/actions';

export const LoginForm = () => {
  const form = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: '',
    },
  });

  const { execute, result, status } = useAction(login);

  const onSubmit = (values: SignIn) => {
    execute(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    disabled={status === 'executing'}
                    placeholder="Email address"
                    type="email"
                  />
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
                <FormControl>
                  <Input
                    {...field}
                    disabled={status === 'executing'}
                    placeholder="Password"
                    type="password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {status === 'hasSucceeded' && (
          <Alert
            className="bg-emerald-500/15 text-emerald-500 p-3 border-emerald-500/15"
            data-testid="alert"
          >
            <IconCheckCircle size={16} />
            <AlertTitle className="mb-0 leading-normal">
              Confirmation email has been sent!
            </AlertTitle>
          </Alert>
        )}
        {result.serverError && (
          <Alert
            className="bg-destructive/15 text-destructive dark:bg-destructive dark:text-destructive-foreground p-3 border-destructive/15 dark:border-destructive"
            data-testid="alert"
          >
            <IconWarning className="size-4" />
            <AlertTitle className="mb-0 leading-normal">
              {result.serverError}
            </AlertTitle>
          </Alert>
        )}

        <Button
          disabled={status === 'executing'}
          type="submit"
          className="w-full"
        >
          {status === 'executing' && (
            <LoaderIcon className="mr-2 size-4 animate-spin" />
          )}
          Log In
        </Button>
      </form>
    </Form>
  );
};