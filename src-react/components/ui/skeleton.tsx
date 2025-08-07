import React from 'react';

import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-background animate-pulse rounded-xs', className)}
      {...props}
    />
  );
}

export { Skeleton };
