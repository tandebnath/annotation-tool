import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels =
  | 'settings:load'
  | 'settings:save'
  | 'dialog:openDirectory'
  | 'dialog:openFile'
  | 'getBookPageCount'
  | 'getFoldersWithTxtFiles'
  | 'getBookContents'
  | 'saveAnnotation'
  | 'loadAnnotations'
  | 'saveVolumeNotes'
  | 'loadVolumeNotes'
  | 'clearVolumeNotes'
  | 'getCsvColumns';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    invoke(channel: Channels, ...args: unknown[]) {
      return ipcRenderer.invoke(channel, ...args);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
