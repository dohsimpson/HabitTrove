'use client';

import { useState } from 'react';
import PasswordEntryForm from './PasswordEntryForm';
import UserForm from './UserForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Crown, Pencil, Plus, User as UserIcon, UserRoundPen, Trash2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAtom } from 'jotai';
import { usersAtom } from '@/lib/atoms';
import { signIn } from '@/app/actions/user';
import { createUser } from '@/app/actions/data';
import { useTranslations } from 'next-intl';
import { toast } from '@/hooks/use-toast';
import { Description } from '@radix-ui/react-dialog';
import { SafeUser, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useHelpers } from '@/lib/client-helpers';

function UserCard({
  user,
  onSelect,
  onEdit,
  showEdit,
  isCurrentUser,
  currentLoggedInUserId, // For "don't delete self" check
  onUserDeleted // Callback to update usersAtom
}: {
  user: User,
  onSelect: () => void,
  onEdit: () => void,
  showEdit: boolean,
  isCurrentUser: boolean,
  currentLoggedInUserId?: string,
  onUserDeleted: (userId: string) => void,
}) {
  const t = useTranslations('UserSelectModal');
  const tWarning = useTranslations('Warning');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteUser = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        toast({
          title: t('deleteUserSuccessTitle'),
          description: t('deleteUserSuccessDescription', { username: user.username }),
        });
        onUserDeleted(user.id);
      } else {
        const errorData = await response.json();
        toast({
          title: t('deleteUserErrorTitle'),
          description: errorData.error || t('genericError'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('deleteUserErrorTitle'),
        description: t('networkError'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div key={user.id} className="relative group">
      <button
        onClick={onSelect}
        disabled={isDeleting} // Disable main button while deleting this user
        className={cn(
          "flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full",
          isCurrentUser && "ring-2 ring-primary"
        )}
      >
        <Avatar className="h-16 w-16">
          <AvatarImage
            src={user.avatarPath && `/api/avatars/${user.avatarPath.split('/').pop()}`}
            alt={user.username}
          />
          <AvatarFallback>
            <UserIcon className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium flex items-center gap-1">
          {user.username}
          {user.isAdmin && <Crown className="h-4 w-4 text-yellow-500" />}
        </span>
      </button>
      {showEdit && (
        <div className="absolute top-0 right-0 flex space-x-1">
          {showEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card selection
                onEdit();
              }}
              disabled={isDeleting}
              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              title={t('editUserTooltip')}
            >
              <UserRoundPen className="h-4 w-4" />
            </button>
          )}
          {showEdit && user.id !== currentLoggedInUserId && (
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <AlertDialogTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card selection
                    setShowDeleteConfirm(true);
                  }}
                  disabled={isDeleting}
                  className="p-1 rounded-full bg-red-200 hover:bg-red-300 dark:bg-red-700 dark:hover:bg-red-600 transition-colors text-red-600 dark:text-red-300"
                  title={t('deleteUserTooltip')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tWarning('areYouSure')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('deleteUserConfirmation', { username: user.username })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false);}} disabled={isDeleting}>{tWarning('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => { e.stopPropagation(); handleDeleteUser();}}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? t('deletingButtonText') : t('confirmDeleteButtonText')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );
}

function AddUserButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations('UserSelectModal');
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <Avatar className="h-16 w-16">
        <AvatarFallback>
          <Plus className="h-8 w-8" />
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{t('addUserButton')}</span>
    </button>
  );
}

function UserSelectionView({
  users,
  currentUserFromHook, // Renamed to avoid confusion with map variable
  onUserSelect,
  onEditUser,
  onCreateUser,
  onUserDeleted, // Pass through the delete handler
}: {
  users: User[],
  currentUserFromHook?: SafeUser,
  onUserSelect: (userId: string) => void,
  onEditUser: (userId: string) => void,
  onCreateUser: () => void,
  onUserDeleted: (userId: string) => void,
}) {
  return (
    <div className="grid grid-cols-3 gap-4 p-2 max-h-80 overflow-y-auto">
      {users
        .filter(user => user.id !== currentUserFromHook?.id) // Show other users
        .map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onSelect={() => onUserSelect(user.id)}
            onEdit={() => onEditUser(user.id)}
            showEdit={!!currentUserFromHook?.isAdmin}
            isCurrentUser={false} // This card isn't the currently logged-in user for switching TO
            currentLoggedInUserId={currentUserFromHook?.id} // For the "don't delete self" check
            onUserDeleted={onUserDeleted}
          />
        ))}
      {currentUserFromHook?.isAdmin && <AddUserButton onClick={onCreateUser} />}
    </div>
  );
}

export default function UserSelectModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('UserSelectModal');
  const [selectedUser, setSelectedUser] = useState<string>();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [usersData, setUsersData] = useAtom(usersAtom);
  const users = usersData.users;
  const { currentUser } = useHelpers();

  const handleUserDeleted = (userIdToDelete: string) => {
    setUsersData(prevData => ({
      ...prevData,
      users: prevData.users.filter(u => u.id !== userIdToDelete)
    }));
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    setError('');
  };

  const handleEditUser = (userId: string) => {
    setSelectedUser(userId);
    setIsEditing(true);
  };

  const handleCreateUser = () => {
    setIsCreating(true);
  };

  const handleFormSuccess = () => {
    setSelectedUser(undefined);
    setIsCreating(false);
    setIsEditing(false);
    onClose();
  };

  const handleFormCancel = () => {
    setSelectedUser(undefined);
    setIsCreating(false);
    setIsEditing(false);
    setError('');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <Description></Description>
        <DialogHeader>
          <DialogTitle>{isCreating ? t('createNewUserTitle') : t('selectUserTitle')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {!selectedUser && !isCreating && !isEditing ? (
            <UserSelectionView
              users={users}
              currentUserFromHook={currentUser}
              onUserSelect={handleUserSelect}
              onEditUser={handleEditUser}
              onCreateUser={handleCreateUser}
              onUserDeleted={handleUserDeleted}
            />
          ) : isCreating || isEditing ? (
            <UserForm
              userId={isEditing ? selectedUser : undefined}
              onCancel={handleFormCancel}
              onSuccess={handleFormSuccess}
            />
          ) : (
            <PasswordEntryForm
              user={users.find(u => u.id === selectedUser)!}
              onCancel={() => setSelectedUser(undefined)}
              onSubmit={async (password) => {
                try {
                  setError('');
                  const user = users.find(u => u.id === selectedUser);
                  if (!user) throw new Error("User not found");
                  await signIn(user.username, password);

                  setError('');
                  onClose();

                  toast({
                    title: t('signInSuccessTitle'),
                    description: t('signInSuccessDescription', { username: user.username }),
                    variant: "default"
                  });

                  setTimeout(() => window.location.reload(), 300);
                } catch (err) {
                  setError(t('errorInvalidPassword'));
                  throw err;
                }
              }}
              error={error}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
