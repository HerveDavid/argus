import { ThemeToggle } from './theme-toggle';
import { Equipement } from './equipment';
import { Mode } from '@/features/mode';
import { NatsSticker } from '@/features/nats-settings';

export const Footer = () => {
  return (
    <div className="w-full p-1 mb-1 h-5 border-t flex items-center shrink-0 justify-between">
      <Mode />
      <Equipement />
      <div className='flex gap-x-6'>
        <NatsSticker />
        <ThemeToggle />
      </div>
    </div>
  );
};
