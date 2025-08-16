'use client';

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/toast';
import { PlusIcon } from './icons';

export function InvitationDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setInviteUrl('');

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, expiresInDays }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invitation');
      }

      toast({
        type: 'success',
        description: `Invitation sent to ${email}`,
      });

      setInviteUrl(data.inviteUrl);
      setEmail('');
    } catch (error) {
      toast({
        type: 'error',
        description: error instanceof Error ? error.message : 'Failed to create invitation',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast({
      type: 'success',
      description: 'Invitation link copied to clipboard',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon />
          Send Invitation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Invitation</DialogTitle>
          <DialogDescription>
            Invite someone to join the platform. They'll receive an invitation link via email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expires" className="text-right">
                Expires in
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="expires"
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  min="1"
                  max="30"
                  required
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
          </div>
          {inviteUrl && (
            <div className="mb-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-2">Invitation Link:</p>
              <div className="flex gap-2">
                <Input
                  value={inviteUrl}
                  readOnly
                  className="text-xs"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={copyToClipboard}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Note: In production, this will be sent via email.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}