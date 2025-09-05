import { GutterMarker } from '@codemirror/view';
import { ExecuteButton } from '../components/execute-button';
import { createRoot, Root } from 'react-dom/client';
import { ExecuteCallback } from '../types';

export class ReactExecuteMarker extends GutterMarker {
  private root: Root | null = null;

  constructor(
    private lineNumber: number,
    private lineContent: string,
    private executeCallback?: ExecuteCallback,
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'react-execute-marker';

    this.root = createRoot(container);

    // React Rendering
    this.root.render(
      <ExecuteButton
        lineNumber={this.lineNumber}
        lineContent={this.lineContent}
        onExecute={this.executeCallback}
      />,
    );

    return container;
  }

  destroy() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}
