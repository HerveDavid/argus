import { invoke } from "@tauri-apps/api/core";
import { CloseDj, OpenDj } from "../components/single-line-diagram/utils/events";

export const sendOpenDj = async (openDj: OpenDj): Promise<void> => {
    return await invoke<void>('send_open_dj', { open_dj: openDj});
} 

export const sendCloseDj = async (closeDj: CloseDj): Promise<void> => {
    return await invoke<void>('send_close_dj', { close_dj: closeDj});
} 