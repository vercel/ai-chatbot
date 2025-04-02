import { getAuthProvider } from '@/lib/arcade/auth-providers';
import { cn } from '@/lib/utils';
import type { AuthorizationResponse } from '@arcadeai/arcadejs/resources/shared.mjs';
import type { ToolInvocation } from 'ai';
import { AlertCircle, CheckCircle2, LockIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ToolArcadeAuthorizationSkeleton } from './tool-arcade-authorization-skeleton';
import { Button, buttonVariants } from './ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { useToolExecution } from '@/lib/arcade/hooks/use-tool-execution';

type ToolArcadeAuthorizationProps = {
  toolInvocation: ToolInvocation;
  addToolResult: ({
    toolCallId,
    result,
  }: {
    toolCallId: string;
    result: any;
  }) => void;
};

export const ToolArcadeAuthorization = ({
  toolInvocation,
  addToolResult,
}: ToolArcadeAuthorizationProps) => {
  const { args } = toolInvocation;
  const isToolCall = toolInvocation.state === 'call';

  const [authResponse, setAuthResponse] =
    useState<AuthorizationResponse | null>(null);

  useToolExecution({
    toolInvocation,
    addToolResult,
    setAuthResponse,
  });

  if (!authResponse) {
    return <ToolArcadeAuthorizationSkeleton />;
  }

  const authProvider = getAuthProvider(authResponse.provider_id);
  const authProviderName = authProvider?.name ?? authResponse.provider_id;

  const Icon = authProvider?.icon ?? LockIcon;

  if (authResponse.status === 'completed') {
    return (
      <Card className="dark:border-green-950 border-green-100">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center space-x-3">
              <div
                className={cn(
                  'flex-shrink-0 p-2 rounded-full',
                  'bg-green-50 dark:bg-green-950/50',
                )}
              >
                <CheckCircle2 className="size-5 text-green-500 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-card-foreground">
                  Authorization Successful
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You&apos;ve successfully connected with {authProviderName}
                </p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div
            className={cn(
              'rounded-md p-3 text-xs',
              'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300',
            )}
          >
            Your connection with {authProviderName} has been successfully saved.
            You can use this provider in future conversations without having to
            authorize again.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (authResponse.status === 'failed') {
    return (
      <Card className="dark:border-red-950 border-red-100">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center space-x-3">
              <div
                className={cn(
                  'flex-shrink-0 p-2 rounded-full',
                  'bg-red-50 dark:bg-red-950/50',
                )}
              >
                <AlertCircle className="size-5 text-red-500 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-card-foreground">
                  Authorization Failed
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  We couldn&apos;t complete the authorization with{' '}
                  {authProviderName}
                </p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {args.authInfo.url && (
            <Link
              href={args.authInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block"
            >
              <Button variant="outline" size="sm" className="w-full">
                Try again
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isToolCall) {
    return (
      <Card key={`auth-card-${toolInvocation.toolCallId}`}>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium">
                  Authorization in progress
                </span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="justify-center items-center flex flex-col gap-4">
          <div className="text-center space-y-1.5">
            <p className="text-sm">
              Complete the authorization in the opened window
            </p>
            <p className="text-xs text-muted-foreground">
              This will connect your account with {authProviderName}
            </p>
          </div>
          <Link
            href={authResponse.url ?? ''}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: 'secondary', size: 'sm' }),
              'w-fit animate-pulse',
            )}
          >
            <Icon className="size-4 mr-2" />
            <span>Waiting for {authProviderName}...</span>
          </Link>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Window not opening?{' '}
            <Link
              href={authResponse.url ?? ''}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Click here to try again
            </Link>
          </p>
        </CardFooter>
      </Card>
    );
  }

  return null;
};
