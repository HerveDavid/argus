import { Link as RouterLink, LinkProps } from 'react-router';

import { cn } from '@/lib/utils';

export const Link = ({ className, children, ...props }: LinkProps) => {
  return (
    <RouterLink className={cn(className)} {...props}>
      {children}
    </RouterLink>
  );
};
