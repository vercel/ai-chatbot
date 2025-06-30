'use client';

import * as React from 'react';
import * as ReactDialog from '@radix-ui/react-dialog';
import { cn } from '@ai-chat/lib/utils';
import { buttonVariants } from './button';

const GenericDialog = ReactDialog.Root;

const GenericDialogTrigger = ReactDialog.Trigger;

const GenericDialogPortal = ReactDialog.Portal;

const GenericDialogOverlay = React.forwardRef<
  React.ElementRef<typeof ReactDialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof ReactDialog.Overlay>
>(({ className, ...props }, ref) => (
  <ReactDialog.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
    ref={ref}
  />
));
GenericDialogOverlay.displayName = ReactDialog.Overlay.displayName;

const GenericDialogContent = React.forwardRef<
  React.ElementRef<typeof ReactDialog.Content>,
  React.ComponentPropsWithoutRef<typeof ReactDialog.Content>
>(({ className, ...props }, ref) => (
  <GenericDialogPortal>
    <GenericDialogOverlay />
    <ReactDialog.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        className,
      )}
      {...props}
    />
  </GenericDialogPortal>
));
GenericDialogContent.displayName = ReactDialog.Content.displayName;

const GenericDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <>
    <div
      className={cn(
        'flex flex-col space-y-2 text-center sm:text-left',
        className,
      )}
      {...props}
    />
    <hr />
  </>
);
GenericDialogHeader.displayName = 'GenericDialogHeader';

const GenericDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className,
    )}
    {...props}
  />
);
GenericDialogFooter.displayName = 'GenericDialogFooter';

const GenericDialogTitle = React.forwardRef<
  React.ElementRef<typeof ReactDialog.Title>,
  React.ComponentPropsWithoutRef<typeof ReactDialog.Title>
>(({ className, ...props }, ref) => (
  <ReactDialog.Title
    ref={ref}
    className={cn('text-lg font-semibold', className)}
    {...props}
  />
));
GenericDialogTitle.displayName = ReactDialog.Title.displayName;

const GenericDialogDescription = React.forwardRef<
  React.ElementRef<typeof ReactDialog.Description>,
  React.ComponentPropsWithoutRef<typeof ReactDialog.Description>
>(({ className, ...props }, ref) => (
  <ReactDialog.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
GenericDialogDescription.displayName = ReactDialog.Description.displayName;

const GenericDialogAction = React.forwardRef<
  React.ElementRef<typeof ReactDialog.Close>,
  React.ComponentPropsWithoutRef<typeof ReactDialog.Close>
>(({ className, ...props }, ref) => (
  <ReactDialog.Close
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
));
GenericDialogAction.displayName = ReactDialog.Close.displayName;

const GenericDialogCancel = React.forwardRef<
  React.ElementRef<typeof ReactDialog.Close>,
  React.ComponentPropsWithoutRef<typeof ReactDialog.Close>
>(({ className, ...props }, ref) => (
  <ReactDialog.Close
    ref={ref}
    className={cn(
      buttonVariants({ variant: 'outline' }),
      'mt-2 sm:mt-0',
      className,
    )}
    {...props}
  />
));
GenericDialogCancel.displayName = ReactDialog.Close.displayName;

export {
  GenericDialog,
  GenericDialogPortal,
  GenericDialogOverlay,
  GenericDialogTrigger,
  GenericDialogContent,
  GenericDialogHeader,
  GenericDialogFooter,
  GenericDialogTitle,
  GenericDialogDescription,
  GenericDialogAction,
  GenericDialogCancel,
};
