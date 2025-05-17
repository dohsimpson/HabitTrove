'use client';

import { useState } from 'react';
import { passwordSchema, usernameSchema } from '@/lib/zod';
import { useTranslations } from 'next-intl';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Permission } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { useAtom, useAtomValue } from 'jotai';
import { serverSettingsAtom, usersAtom } from '@/lib/atoms';
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
  const t = useTranslations('UserForm');
  const [users, setUsersData] = useAtom(usersAtom);
  const serverSettings = useAtomValue(serverSettingsAtom)
  const user = userId ? users.users.find(u => u.id === userId) : undefined;
  const { currentUser } = useHelpers()
  const getDefaultPermissions = (): Permission[] => [{
    habit: {
      write: true,
      interact: true
    },
    wishlist: {
      write: true,
      interact: true
    },
    coins: {
      write: true,
      interact: true
    }
  }];

  const [avatarPath, setAvatarPath] = useState(user?.avatarPath)
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState<string | undefined>('');
  const [disablePassword, setDisablePassword] = useState(user?.password === '' || serverSettings.isDemo);
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
      // Validate username
      const usernameResult = usernameSchema.safeParse(username);
      if (!usernameResult.success) {
        setError(usernameResult.error.errors[0].message);
        return;
      }

      // Validate password unless disabled
      if (!disablePassword && password) {
        const passwordResult = passwordSchema.safeParse(password);
        if (!passwordResult.success) {
          setError(passwordResult.error.errors[0].message);
          return;
        }
      }

      if (isEditing) {
        // Update existing user
        if (username !== user.username || avatarPath !== user.avatarPath || !_.isEqual(permissions, user.permissions) || isAdmin !== user.isAdmin) {
          await updateUser(user.id, { username, avatarPath, permissions, isAdmin });
        }

        // Handle password update
        if (disablePassword) {
          await updateUserPassword(user.id, undefined);
        } else if (password) {
          await updateUserPassword(user.id, password);
        }

        setUsersData(prev => ({
          ...prev,
          users: prev.users.map(u =>
            u.id === user.id ? { 
              ...u, 
              username, 
              avatarPath, 
              permissions, 
              isAdmin,
              password: disablePassword ? '' : (password || u.password) // use the correct password to update atom
            } : u
          ),
        }));

        toast({
          title: t('toastUserUpdatedTitle'),
          description: t('toastUserUpdatedDescription', { username }),
          variant: 'default'
        });
      } else {
        // Create new user
        const formData = new FormData();
        formData.append('username', username);
        if (disablePassword) {
          formData.append('password', '');
        } else if (password) {
          formData.append('password', password);
        }
        formData.append('permissions', JSON.stringify(isAdmin ? undefined : permissions));
        formData.append('isAdmin', JSON.stringify(isAdmin));
        formData.append('avatarPath', avatarPath || '');

        const newUser = await createUser(formData);
        setUsersData(prev => ({
          ...prev,
          users: [...prev.users, newUser]
        }));

        toast({
          title: t('toastUserCreatedTitle'),
          description: t('toastUserCreatedDescription', { username }),
          variant: 'default'
        });
      }

      setPassword('');
      setError('');
      onSuccess();
    } catch (err) {
      const action = isEditing ? t('actionUpdate') : t('actionCreate');
      setError(err instanceof Error ? err.message : t('errorFailedUserAction', { action }));
    }
  };

  const handleAvatarChange = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({
        title: t('errorTitle'),
        description: t('errorFileSizeLimit'),
        variant: 'destructive'
      });
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const path = await uploadAvatar(formData);
      setAvatarPath(path);
      setAvatarFile(null); // Clear the file since we've uploaded it
      toast({
        title: t('toastAvatarUploadedTitle'),
        description: t('toastAvatarUploadedDescription'),
        variant: 'default'
      });
    } catch (err) {
      toast({
        title: t('errorTitle'),
        description: t('errorFailedAvatarUpload'),
        variant: 'destructive'
      });
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
            {isEditing ? t('changeAvatarButton') : t('uploadAvatarButton')}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">{t('usernameLabel')}</Label>
          <Input
            id="username"
            type="text"
            placeholder={t('usernamePlaceholder')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">
              {isEditing ? t('newPasswordLabel') : t('passwordLabel')}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={isEditing ? t('passwordPlaceholderEdit') : t('passwordPlaceholderCreate')}
              value={password || ''}
              onChange={(e) => setPassword(e.target.value)}
              className={error ? 'border-red-500' : ''}
              disabled={disablePassword}
            />
            {serverSettings.isDemo && (
              <p className="text-sm text-red-500">{t('demoPasswordDisabledMessage')}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="disable-password"
              checked={disablePassword}
              onCheckedChange={setDisablePassword}
              disabled={serverSettings.isDemo}
            />
            <Label htmlFor="disable-password">{t('disablePasswordLabel')}</Label>
          </div>
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
          {t('cancelButton')}
        </Button>
        <Button type="submit" disabled={!username}>
          {isEditing ? t('saveChangesButton') : t('createUserButton')}
        </Button>
      </div>
    </form>
  );
}
