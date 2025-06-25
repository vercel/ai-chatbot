'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/toast'; // Assuming toast component exists

interface AdjustWalletFormProps {
  userId: string;
  currentBalance: number;
  onBalanceUpdate?: (newBalance: number) => void; // Callback to update UI optimistically or on success
}

export function AdjustWalletForm({ userId, currentBalance, onBalanceUpdate }: AdjustWalletFormProps) {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const adjustmentAmount = parseInt(amount, 10);
    if (isNaN(adjustmentAmount) || adjustmentAmount === 0) {
      setError('Please enter a valid non-zero integer amount.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/wallet/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, amount: adjustmentAmount }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to adjust wallet (status: ${response.status})`);
      }

      toast({
        title: 'Success',
        description: `Wallet balance adjusted. New balance: ${result.newBalance}`,
      });
      setAmount(''); // Reset form
      if (onBalanceUpdate) {
        onBalanceUpdate(result.newBalance);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      toast({
        title: 'Error',
        description: err.message || 'Failed to adjust wallet.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg shadow-sm bg-card">
      <div>
        <Label htmlFor={`amount-${userId}`}>Adjustment Amount</Label>
        <p className="text-xs text-muted-foreground mb-1">
          Enter a positive value to credit, or a negative value to debit. Current balance: {currentBalance}
        </p>
        <Input
          id={`amount-${userId}`}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g., 100 or -50"
          disabled={isLoading}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Adjusting...' : 'Adjust Balance'}
      </Button>
    </form>
  );
}
