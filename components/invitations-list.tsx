'use client';

import { useEffect, useState } from 'react';
import { formatDistance } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/toast';
import type { Invitation } from '@/lib/db/schema';

export function InvitationsList() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations');
      const data = await response.json();
      
      if (response.ok) {
        setInvitations(data.invitations);
      }
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to load invitations',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const revokeInvitation = async (token: string) => {
    try {
      const response = await fetch(`/api/invitations?token=${token}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          type: 'success',
          description: 'Invitation revoked',
        });
        fetchInvitations();
      } else {
        throw new Error('Failed to revoke invitation');
      }
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to revoke invitation',
      });
    }
  };

  const getStatusBadge = (status: string, expiresAt: Date) => {
    if (status === 'pending' && new Date(expiresAt) < new Date()) {
      return <Badge variant="secondary">Expired</Badge>;
    }

    switch (status) {
      case 'pending':
        return <Badge variant="default">Pending</Badge>;
      case 'accepted':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Accepted</Badge>;
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading invitations...</div>;
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No invitations sent yet.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => (
            <TableRow key={invitation.id}>
              <TableCell className="font-medium">{invitation.email}</TableCell>
              <TableCell>
                {getStatusBadge(invitation.status, invitation.expiresAt)}
              </TableCell>
              <TableCell>
                {formatDistance(new Date(invitation.createdAt), new Date(), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell>
                {formatDistance(new Date(invitation.expiresAt), new Date(), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell className="text-right">
                {invitation.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeInvitation(invitation.token)}
                  >
                    Revoke
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}