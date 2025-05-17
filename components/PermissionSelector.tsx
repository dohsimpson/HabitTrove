'use client';

import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Permission } from '@/lib/types';
import { useTranslations } from 'next-intl';

interface PermissionSelectorProps {
  permissions: Permission[];
  isAdmin: boolean;
  onPermissionsChange: (permissions: Permission[]) => void;
  onAdminChange: (isAdmin: boolean) => void;
}

export function PermissionSelector({
  permissions,
  isAdmin,
  onPermissionsChange,
  onAdminChange,
}: PermissionSelectorProps) {
  const t = useTranslations('PermissionSelector');

  const permissionLabels: { [key: string]: string } = {
    habit: t('resourceHabitTask'),
    wishlist: t('resourceWishlist'),
    coins: t('resourceCoins')
  };

  const currentPermissions = isAdmin ?
    {
      habit: { write: true, interact: true },
      wishlist: { write: true, interact: true },
      coins: { write: true, interact: true }
    } :
    permissions[0] || {
      habit: { write: false, interact: true },
      wishlist: { write: false, interact: true },
      coins: { write: false, interact: true }
    };

  const handlePermissionChange = (resource: keyof Permission, type: 'write' | 'interact', checked: boolean) => {
    const newPermissions = [{
      ...currentPermissions,
      [resource]: {
        ...currentPermissions[resource],
        [type]: checked
      }
    }];
    onPermissionsChange(newPermissions);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('permissionsTitle')}</Label>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="font-medium text-sm">{t('adminAccessLabel')}</div>
            </div>
            <Switch
              id="isAdmin"
              className="h-4 w-7"
              checked={isAdmin}
              onCheckedChange={onAdminChange}
            />
          </div>

          {isAdmin ? (
            <p className="text-xs text-muted-foreground px-3">
              {t('adminAccessDescription')}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {['habit', 'wishlist', 'coins'].map((resource) => (
                <div key={resource} className="p-3 space-y-3 rounded-lg border bg-muted/50">
                  <div className="font-medium capitalize text-sm border-b pb-2">{permissionLabels[resource]}</div>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <Label htmlFor={`${resource}-write`} className="text-xs text-muted-foreground break-words">{t('permissionWrite')}</Label>
                      <Switch
                        id={`${resource}-write`}
                        className="h-4 w-7"
                        checked={currentPermissions[resource as keyof Permission].write}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(resource as keyof Permission, 'write', checked)
                        }
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <Label htmlFor={`${resource}-interact`} className="text-xs text-muted-foreground break-words">{t('permissionInteract')}</Label>
                      <Switch
                        id={`${resource}-interact`}
                        className="h-4 w-7"
                        checked={currentPermissions[resource as keyof Permission].interact}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(resource as keyof Permission, 'interact', checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
