'use client';

import { toast } from '@/hooks/use-toast';
import { User } from '@/lib/types';
import { User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface PasswordEntryFormProps {
  user: User;
  onCancel: () => void;
  onSubmit: (password: string) => Promise<void>;
  error?: string;
}

export default function PasswordEntryForm({ 
  user, 
  onCancel, 
  onSubmit,
  error 
}: PasswordEntryFormProps) {
  const hasPassword = !!user.password;
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(password);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Login failed',
        variant: "destructive"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Avatar className="h-24 w-24">
          <AvatarImage 
            src={user.avatarPath && `/api/avatars/${user.avatarPath.split('/').pop()}`} 
          />
          <AvatarFallback>
            <UserIcon className="h-12 w-12" />
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <div className="font-medium text-lg">
            {user.username}
          </div>
          <button 
            type="button"
            onClick={onCancel}
            className="text-sm text-blue-500 hover:text-blue-600 mt-1"
          >
            Not you?
          </button>
        </div>
      </div>

      {hasPassword && <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 p-2 rounded">{error}</p>
          )}
        </div>
      </div>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={hasPassword && !password}>
          Login
        </Button>
      </div>
    </form>
  );
}
