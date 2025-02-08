'use client';

import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Permission } from '@/lib/types';

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
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="isAdmin">Is Admin?</Label>
        <Switch
          id="isAdmin"
          checked={isAdmin}
          onCheckedChange={onAdminChange}
        />
      </div>

      {isAdmin ? (
        <p className="text-sm text-muted-foreground">
          Admins have full write and interact permission to all data.
        </p>
      ) :
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              {['habit', 'wishlist', 'coins'].map((resource) => (
                <div key={resource} className="space-y-2">
                  <div className="font-medium capitalize">{resource}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${resource}-write`}>Write</Label>
                      <Switch
                        id={`${resource}-write`}
                        checked={currentPermissions[resource as keyof Permission].write}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(resource as keyof Permission, 'write', checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${resource}-interact`}>Interact</Label>
                      <Switch
                        id={`${resource}-interact`}
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
          </div>
        </div>
      }
    </div>


  );
}
