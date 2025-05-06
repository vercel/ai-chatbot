'use client';

import { useState } from 'react';
import { Shield, BadgeInfo } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToolPermissionDialog } from './tool-permission-dialog';

interface ToolPermissionRequestProps {
  toolName: string;
  description: string;
  args?: any;
  onAllowOnceAction: () => void;
  onAllowAlwaysAction: () => void;
  onDenyAction: () => void;
}

export function ToolPermissionRequest({
  toolName,
  description,
  args,
  onAllowOnceAction,
  onAllowAlwaysAction,
  onDenyAction,
}: ToolPermissionRequestProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="size-4 text-muted-foreground" />
            <span>
              Permission Required: <span className="font-mono">{toolName}</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
        <CardFooter className="flex justify-between gap-2 pt-0">
          <div className="flex-1">
            <Button variant="ghost" size="sm" onClick={onDenyAction}>
              Deny
            </Button>
          </div>
          <div className="flex flex-row justify-between gap-2">
            <Button size="sm" onClick={onAllowAlwaysAction}>
              Allow always
            </Button>
            <Button size="sm" onClick={onAllowOnceAction}>
              Allow once
            </Button>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(true)}
              >
                <BadgeInfo className="size-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      <ToolPermissionDialog
        open={dialogOpen}
        onOpenChangeAction={setDialogOpen}
        toolName={toolName}
        description={description}
        args={args}
      />
    </>
  );
}
