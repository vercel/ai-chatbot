import type { ToolInvocation } from 'ai';
import { Card, CardContent } from './ui/card';
import { AlertCircle } from 'lucide-react';

export const ToolArcadeError = ({
  toolInvocation,
  error,
}: {
  toolInvocation: ToolInvocation;
  error: string;
}) => {
  const { args } = toolInvocation;

  return (
    <Card>
      <CardContent className="flex flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4" />
            <span>Failed to execute tool</span>
          </div>
        </div>
        <p className="text-xs text-destructive mb-2">Error Message: {error}</p>
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
