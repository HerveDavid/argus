import { EditorView } from '@codemirror/view';
import { ViewUpdate, PluginValue } from '@codemirror/view';

export class ExecuteGutterPlugin implements PluginValue {
  private cleanupTimeouts: Set<number> = new Set();

  constructor(view: EditorView) {}

  update(update: ViewUpdate): void {
    if (update.selectionSet || update.docChanged) {
      update.view.requestMeasure();
    }
  }

  destroy(): void {
    this.cleanupTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.cleanupTimeouts.clear();
  }
}
