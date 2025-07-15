import * as go from 'gojs';

// Custom LinkingTool class with proper TypeScript typing
export class CustomLinkingTool extends go.LinkingTool {
  constructor(init?: Partial<go.LinkingTool>) {
    super();
    if (init) Object.assign(this, init);
  }

  // User-drawn linking is normally disabled, but must be enabled when using this tool
  public doStart(): void {
    this.diagram.allowLink = true;
    super.doStart();
  }

  public doStop(): void {
    super.doStop();
    this.diagram.allowLink = false;
  }
}
