import { NatsSticker } from '@/features/nats-settings';

import { Equipement } from './equipment';
import { ThemeToggle } from './theme-toggle';

export const Footer = () => {
  return (
    <div className="w-full h-5 flex items-center border-t p-1 mb-1 shrink-0">
      <div className="relative flex-1 flex justify-start">
        <span className="text-xs text-muted-foreground">NOR</span>
      </div>

      <div className="relative flex flex-1">&nbsp;</div>

      <div className="relative flex-1 flex justify-center">
        <Equipement />
      </div>

      <div className="relative flex flex-1">&nbsp;</div>

      <div className="relative flex-1 flex justify-end">
        <div className="flex gap-x-6">
          <NatsSticker />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};
