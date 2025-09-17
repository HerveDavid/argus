import { Equipement } from './equipment';
import { ThemeToggle } from './theme-toggle';

import { NatsSticker } from '@/features/nats-settings';
import { GameMasterSticker } from '@/features/game-master-settings';

export const Footer = () => {
  return (
    <div className="mb-1 flex h-5 w-full shrink-0 items-center border-t p-1">
      <div className="relative flex flex-1 justify-start">
        <div className="flex items-center gap-x-6">
          <ThemeToggle />
          <span className="text-muted-foreground text-xs">NOR</span>
        </div>
      </div>

      <div className="relative flex flex-1">&nbsp;</div>

      <div className="relative flex flex-1 justify-center">
        <Equipement />
      </div>

      <div className="relative flex flex-1">&nbsp;</div>

      <div className="relative flex flex-1 justify-end">
        <div className="flex gap-x-6">
          <GameMasterSticker />
          <NatsSticker />
        </div>
      </div>
    </div>
  );
};
