import type { ToolInvocation } from 'ai';
import { Card, CardContent } from './ui/card';
import { getAuthProviderByToolkitId } from '@/lib/arcade/auth-providers';
import { LockIcon, Loader2 } from 'lucide-react';
import { getToolkitNameByOpenAIToolName } from '@/lib/arcade/utils';

export const ToolArcadeAuthorizationLoading = ({
  toolInvocation,
}: {
  toolInvocation: ToolInvocation;
}) => {
  const { args } = toolInvocation;
  const authProvider = getAuthProviderByToolkitId(
    getToolkitNameByOpenAIToolName(toolInvocation.toolName),
  );
  const authProviderName = authProvider?.name ?? toolInvocation.toolName;
  const Icon = authProvider?.icon ?? LockIcon;

  return (
    <Card>
      <CardContent className="flex flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Icon className="size-4" />
            <Loader2 className="size-4 animate-spin" />
            <span>Connecting to {authProviderName}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            This may take a few moments
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Please wait while we establish a secure connection
        </p>
        {Object.keys(args).length > 0 && (
          <div className="w-full p-2 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-medium">Tool Arguments:</h4>
            </div>
            <pre className="text-xs text-muted-foreground overflow-auto">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
