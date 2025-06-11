type LedColor = 'red' | 'green' | 'blue' | 'yellow' | 'orange';
type LedSize = 'sm' | 'md' | 'lg' | 'xl';

export interface LedProps {
  color?: LedColor;
  isOn?: boolean;
  size?: LedSize;
  variant?: 'default';
  className?: string;
}

export const Led = ({
  color = 'red',
  isOn = false,
  size = 'md',
  className = '',
}) => {
  const sizeClasses: Record<LedSize, string> = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const colorClasses: Record<LedColor, string> = {
    red: isOn ? 'bg-red-500 shadow-red-500' : 'bg-red-500',
    green: isOn ? 'bg-green-500 shadow-green-500' : 'bg-green-500',
    blue: isOn ? 'bg-blue-500 shadow-blue-500' : 'bg-blue-500',
    yellow: isOn ? 'bg-yellow-500 shadow-yellow-500' : 'bg-yellow-500',
    orange: isOn ? 'bg-orange-500 shadow-orange-500' : 'bg-orange-500',
  };

  return (
    <div
      className={`
        ${sizeClasses[size as LedSize]} 
        ${colorClasses[color as LedColor]}
        rounded-full 
        border-1
        border-slate-600
        transition-all 
        duration-200
        ${isOn ? 'shadow-lg animate-pulse' : 'shadow-none'}
        ${className}
      `}
    />
  );
};
