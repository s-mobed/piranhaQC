import { contextBridge, ipcRenderer } from 'electron';
import type {CsvFileData } from './shared/types';

window.addEventListener("DOMContentLoaded", () => {
    console.log("Preload script loaded")
})

contextBridge.exposeInMainWorld('electronAPI', {
    sendMessage: (channel: string, data: unknown) => {
        const validChannels = ['message-from-renderer'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    onMessage: (channel: string, callback: (...args: unknown[]) => void) => {
        const validChannels = ['message-from-main'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (_event, ...args) => callback(...args));
        }
    },
    openFolder: (): Promise<CsvFileData[]> => ipcRenderer.invoke("folder:open"),
    saveFile: (file: CsvFileData): Promise<boolean> => ipcRenderer.invoke("file:save", file),
});