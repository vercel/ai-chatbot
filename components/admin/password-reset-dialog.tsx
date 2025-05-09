'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CopyIcon, CheckIcon, RefreshCwIcon } from 'lucide-react';

// Country list for password generation
const countries = [
  'Australia',
  'Brazil',
  'Canada',
  'Denmark',
  'England',
  'France',
  'Germany',
  'Holland',
  'Italy',
  'Japan',
  'Korea',
  'Mexico',
  'Norway',
  'Portugal',
  'Russia',
  'Spain',
  'Sweden',
  'Switzerland',
];

// Common words for password generation
const words = [
  'Football',
  'Music',
  'Ocean',
  'Mountain',
  'Forest',
  'Computer',
  'Coffee',
  'Book',
  'Garden',
  'Winter',
  'Summer',
  'Bicycle',
  'Painting',
  'Running',
  'Cooking',
];

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; email: string; role: string; type: string };
  onResetPassword: (userId: string) => Promise<any>;
}

export function PasswordResetDialog({
  open,
  onOpenChange,
  user,
  onResetPassword,
}: PasswordResetDialogProps) {
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate password on open and when refresh button is clicked
  const generatePassword = () => {
    const country = countries[Math.floor(Math.random() * countries.length)];
    const word = words[Math.floor(Math.random() * words.length)];
    const numbers = Math.floor(10000 + Math.random() * 90000); // 5-digit number
    setPassword(`${country}-${word}${numbers}`);
    setCopied(false);
  };

  // Generate password when dialog opens
  useEffect(() => {
    if (open) {
      generatePassword();
    }
  }, [open]);

  // Copy password to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);

    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Handle password reset
  const handleResetPassword = async () => {
    // In a real app, this would make a server call to reset the password
    console.log(`Resetting password for ${user.email} to ${password}`);

    // Close the dialog
    onOpenChange(false);

    // Call the onResetPassword function
    await onResetPassword(user.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Generate a temporary password for {user.email}. The user will be
            prompted to change it on first login.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Temporary Password
            </label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  value={password}
                  readOnly
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {copied ? (
                    <CheckIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <CopyIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generatePassword}
              >
                <RefreshCwIcon className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Format: Country-Word##### (Example: Holland-Football83748)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleResetPassword}>
            Reset Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
