'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { Input } from '@/components/ui/input';

import { TriangleAlertIcon as IconWarning, LoaderIcon } from 'lucide-react';
import { CheckCircleFillIcon as IconCheckCircle } from '@/components/icons';
import { Alert, AlertTitle } from '../ui/alert';

import { SignInSchema } from '@/lib/validators';
import { login } from '@/app/(auth)/actions';
import { redirect } from 'next/navigation';

export const LoginForm = () => {
  const { form, action, handleSubmitWithAction, resetFormAndAction } =
    useHookFormAction(login, zodResolver(SignInSchema), {
      formProps: {
        mode: 'onChange',
      },
      actionProps: {
        onSuccess: () => {
          resetFormAndAction();
          redirect('/');
        },
      },
    });

  const { status, result } = action;
  const { isValid, errors } = form.formState;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmitWithAction} className="space-y-4">
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

        {errors.root && <FormMessage>{errors.root.message}</FormMessage>}

        {status === 'hasSucceeded' && (
          <Alert
            className="bg-emerald-500/15 text-emerald-500 p-3 border-emerald-500/15"
            data-testid="alert"
          >
            <IconCheckCircle size={16} />
            <AlertTitle className="mb-0 leading-normal">
              Logged in successfully!
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
          disabled={status === 'executing' || !isValid}
          type="submit"
          className="w-full"
        >
          {status === 'executing' && (
            <LoaderIcon className="mr-1 size-4 animate-spin" />
          )}
          Log In
        </Button>
      </form>
    </Form>
  );
};
