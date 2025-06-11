import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { getProjectInitials } from '../../utils/utils';

export const ProjectAvatar = ({
  name,
  className = 'size-6',
}: {
  name: string;
  className?: string;
}) => {
  const initials = getProjectInitials(name);
  return (
    <Avatar className={className}>
      <AvatarFallback className="text-xs font-medium bg-blue-600">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};
