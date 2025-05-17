import { invoke } from '@tauri-apps/api/core';

export async function setConfig(
  config_path: string,
): Promise<{ status: string }> {
  try {
    return await invoke<{ status: string }>('load_config_file', {
      config_path,
    });
  } catch (error) {
    throw new Error(`Failed to configure proxy: ${error}`);
  }
}
