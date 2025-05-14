'use client';

import { signIn } from '@/app/actions/user';
import { toast } from '@/hooks/use-toast';
import { usersAtom } from '@/lib/atoms';
import { useHelpers } from '@/lib/client-helpers';
import { SafeUser, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Description } from '@radix-ui/react-dialog';
import { useAtom } from 'jotai';
import { Crown, Plus, User as UserIcon, UserRoundPen } from 'lucide-react';
import { useState } from 'react';
import PasswordEntryForm from './PasswordEntryForm';
import UserForm from './UserForm';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

function UserCard({ 
  user, 
  onSelect,
  onEdit,
  showEdit,
  isCurrentUser
}: {
  user: User,
  onSelect: () => void,
  onEdit: () => void,
  showEdit: boolean,
  isCurrentUser: boolean
}) {
  return (
    <div key={user.id} className="relative group">
      <button
        onClick={onSelect}
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute top-0 right-0 p-1 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
        >
          <UserRoundPen className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function AddUserButton({ onClick }: { onClick: () => void }) {
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
      <span className="text-sm font-medium">Add User</span>
    </button>
  );
}

function UserSelectionView({
  users,
  currentUser,
  onUserSelect,
  onEditUser,
  onCreateUser
}: {
  users: User[],
  currentUser?: SafeUser,
  onUserSelect: (userId: string) => void,
  onEditUser: (userId: string) => void,
  onCreateUser: () => void
}) {
  return (
    <div className="grid grid-cols-3 gap-4 p-2 max-h-80 overflow-y-auto">
      {users
        .filter(user => user.id !== currentUser?.id)
        .map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onSelect={() => onUserSelect(user.id)}
            onEdit={() => onEditUser(user.id)}
            showEdit={!!currentUser?.isAdmin}
            isCurrentUser={false}
          />
      ))}
      {currentUser?.isAdmin && <AddUserButton onClick={onCreateUser} />}
    </div>
  );
}

export default function UserSelectModal({ onClose }: { onClose: () => void }) {
  const [selectedUser, setSelectedUser] = useState<string>();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [usersData] = useAtom(usersAtom);
  const users = usersData.users;
const {currentUser} = useHelpers();

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
          <DialogTitle>{isCreating ? 'Create New User' : 'Select User'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {!selectedUser && !isCreating && !isEditing ? (
            <UserSelectionView
              users={users}
              currentUser={currentUser}
              onUserSelect={handleUserSelect}
              onEditUser={handleEditUser}
              onCreateUser={handleCreateUser}
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
                    title: "Signed in successfully",
                    description: `Welcome back, ${user.username}!`,
                    variant: "default"
                  });

                  setTimeout(() => window.location.reload(), 300);
                } catch (err) {
                  setError('invalid password');
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
