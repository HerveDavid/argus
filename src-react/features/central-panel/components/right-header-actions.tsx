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
        title={'Detach group'}
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
        <DialogContent className="max-w-none w-[90vw] h-[90vh] max-h-[90vh] sm:max-w-none">
          <DialogHeader>
            <DialogTitle>{props.activePanel?.id}</DialogTitle>
            <div className="w-full h-full">
              {props.activePanel?.id && (
                <div className="w-full h-full">
                  <Sld id={props.activePanel.id} />
                </div>
              )}
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};
