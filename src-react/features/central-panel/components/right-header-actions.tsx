import { IDockviewHeaderActionsProps } from 'dockview';
import { Maximize, ScreenShare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sld } from '@/features/single-line-diagram';
import { useCentralPanelStore } from '@/stores/central-panel.store';

export const RightHeaderActions = (props: IDockviewHeaderActionsProps) => {
  const { detachPanel } = useCentralPanelStore();

  const handleDetachPanel = () => {
    detachPanel(props.activePanel!.id);
  };

  return (
    <div className="h-full flex items-center px-2 gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDetachPanel}
        className="size-5 p-0 hover:bg-accent text-muted-foreground"
        title="Detach group"
      >
        <ScreenShare className="size-4" />
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-5 p-0 hover:bg-accent text-muted-foreground"
            title="View in fullscreen"
          >
            <Maximize className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-none w-[95vw] h-[80vh] max-h-[80vh] p-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{props.activePanel?.id}</DialogTitle>
          </DialogHeader>
          <div className="h-full w-full overflow-hidden">
            {props.activePanel?.id && <Sld id={props.activePanel.id} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
