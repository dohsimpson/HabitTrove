'use client';

import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Permission } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { useAtom } from 'jotai';
import { usersAtom } from '@/lib/atoms';
import { createUser, updateUser, updateUserPassword, uploadAvatar } from '@/app/actions/data';
import { SafeUser, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User as UserIcon } from 'lucide-react';
import _ from 'lodash';
import { PermissionSelector } from './PermissionSelector';
import { useHelpers } from '@/lib/client-helpers';

interface UserFormProps {
  userId?: string;  // if provided, we're editing; if not, we're creating
  onCancel: () => void;
  onSuccess: () => void;
}

export default function UserForm({ userId, onCancel, onSuccess }: UserFormProps) {
  const [users, setUsersData] = useAtom(usersAtom);
  const user = userId ? users.users.find(u => u.id === userId) : undefined;
  const { currentUser } = useHelpers()
  const getDefaultPermissions = (): Permission[] => [{
    habit: {
      write: false,
      interact: true
    },
    wishlist: {
      write: false,
      interact: true
    },
    coins: {
      write: false,
      interact: true
    }
  }];

  const [avatarPath, setAvatarPath] = useState(user?.avatarPath)
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isAdmin, setIsAdmin] = useState(user?.isAdmin || false);
  const [permissions, setPermissions] = useState<Permission[]>(
    user?.permissions || getDefaultPermissions()
  );
  const isEditing = !!user;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing) {
        // Update existing user
        if (username !== user.username || avatarPath !== user.avatarPath || !_.isEqual(permissions, user.permissions) || isAdmin !== user.isAdmin) {
          await updateUser(user.id, { username, avatarPath, permissions, isAdmin });
        }

        if (password) {
          await updateUserPassword(user.id, password);
        }

        setUsersData(prev => ({
          ...prev,
          users: prev.users.map(u =>
            u.id === user.id ? { ...u, username, avatarPath, permissions, isAdmin } : u
          ),
        }));

        toast({
          title: "User updated",
          description: `Successfully updated user ${username}`,
          variant: 'default'
        });
      } else {
        // Create new user
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('permissions', JSON.stringify(isAdmin ? undefined : permissions));
        formData.append('isAdmin', JSON.stringify(isAdmin));
        if (avatarFile) {
          formData.append('avatar', avatarFile);
        }

        const newUser = await createUser(formData);
        setUsersData(prev => ({
          ...prev,
          users: [...prev.users, newUser]
        }));

        toast({
          title: "User created",
          description: `Successfully created user ${username}`,
          variant: 'default'
        });
      }

      setPassword('');
      setError('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEditing ? 'update' : 'create'} user`);
    }
  };

  const handleAvatarChange = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: 'destructive'
      });
      return;
    }

    if (isEditing) {
      const formData = new FormData();
      formData.append('avatar', file);

      try {
        const path = await uploadAvatar(formData);
        setAvatarPath(path);
        toast({
          title: "Avatar uploaded",
          description: "Successfully uploaded avatar",
          variant: 'default'
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to upload avatar",
          variant: 'destructive'
        });
      }
    } else {
      setAvatarFile(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto p-4">
      <div className="flex flex-col items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Avatar className="h-24 w-24">
          <AvatarImage
            src={avatarPath && `/api/avatars/${avatarPath.split('/').pop()}`}
            alt={username}
          />
          <AvatarFallback>
            <UserIcon className="h-12 w-12" />
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
                handleAvatarChange(file);
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const input = document.getElementById('avatar') as HTMLInputElement;
              input.value = ''; // Reset input to allow selecting same file again
              input.click();
            }}
            className="w-full"
          >
            {isEditing ? 'Change Avatar' : 'Upload Avatar'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            {isEditing ? 'New Password' : 'Password'}
          </Label>
          <Input
            id="password"
            type="password"
            placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={error ? 'border-red-500' : ''}
            required={!isEditing}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 p-2 rounded">{error}</p>
        )}

        
        {currentUser && currentUser.isAdmin && <PermissionSelector
          permissions={permissions}
          isAdmin={isAdmin}
          onPermissionsChange={setPermissions}
          onAdminChange={setIsAdmin}
        />}

      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!username || (!isEditing && !password)}>
          {isEditing ? 'Save Changes' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
