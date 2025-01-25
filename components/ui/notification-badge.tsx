import React from 'react';
import {Badge, BadgeProps} from './badge';
import {cn} from '@/lib/utils';

export interface NotificationBadgeProps extends BadgeProps {
  label?: string | number;
  show?: boolean;
  variant?: 'destructive' | 'default' | 'secondary';
}

export const NotificationBadge = ({
  label,
  className,
  show,
  variant = 'destructive',
  children,
  ...props
}: NotificationBadgeProps) => {
  const showBadge =
    typeof label !== 'undefined' && (typeof show === 'undefined' || show);
  return (
    <div className='inline-flex relative'>
      {children}
      {showBadge && (
        <Badge
          variant={variant}
          className={cn(
            'absolute rounded-full -top-1.5 -right-1.5 z-20 border h-4 w-4 p-0 flex items-center justify-center text-xs',
            typeof label !== 'undefined' && ('' + label).length === 0
              ? ''
              : 'min-w-[1rem]',
            className
          )}
          {...props}
        >
          {'' + label}
        </Badge>
      )}
    </div>
  );
};