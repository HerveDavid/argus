import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const SessionAvatar = ({
  name,
  className = 'size-6',
}: {
  name: string;
  className?: string;
}) => {
  const initials = name;
  return (
    <Avatar className={className}>
      <AvatarFallback className="text-xs font-medium bg-blue-600">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};
