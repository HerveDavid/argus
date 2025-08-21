export class ModeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'ModeError';
  }
}

export class InvalidModeError extends ModeError {
  constructor(mode: string) {
    super(`Mode invalide: ${mode}`, 'INVALID_MODE');
  }
}

export class TauriInvokeError extends ModeError {
  constructor(message: string) {
    super(`Erreur Tauri: ${message}`, 'TAURI_ERROR');
  }
}
