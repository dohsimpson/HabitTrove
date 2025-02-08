'use client';

import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User } from 'lucide-react';
import { createUser } from '@/app/actions/data';
import { useAtom } from 'jotai';
import { usersAtom } from '@/lib/atoms';

export default function UserCreateForm({
  onCancel,
  onSuccess
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [newUsername, setNewUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [, setUsersData] = useAtom(usersAtom);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !password) return;

    try {
      const formData = new FormData();
      formData.append('username', newUsername);
      formData.append('password', password);
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      
      const newUser = await createUser(formData);
      
      setUsersData(prev => ({
        ...prev,
        users: [...prev.users, newUser],
      }));

      setPassword('');
      setNewUsername('');
      setError('');
      onSuccess();
      
      toast({
        title: "User created",
        description: `Successfully created user ${newUser.username}`,
        variant: 'default'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  return (
    <form onSubmit={handleCreateUser} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Username"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          className={error ? 'border-red-500' : ''}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={error ? 'border-red-500' : ''}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src="" />
          <AvatarFallback>
            <User className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <div>
          <input
            type="file"
            id="avatar"
            name="avatar"
            accept="image/png, image/jpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 5 * 1024 * 1024) {
                  toast({
                    title: "Error",
                    description: "File size must be less than 5MB",
                    variant: "destructive"
                  });
                  return;
                }
                setAvatarFile(file);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const input = document.getElementById('avatar') as HTMLInputElement;
              input.value = ''; // Reset input to allow selecting same file again
              input.click();
            }}
          >
            Upload Avatar
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!newUsername || !password}>
          Create
        </Button>
      </div>
    </form>
  );
}
