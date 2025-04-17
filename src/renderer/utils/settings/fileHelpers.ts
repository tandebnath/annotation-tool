export const handleBrowseDirectory = async (setValue: (val: string) => void) => {
    const path = await window.electron.ipcRenderer.invoke('dialog:openDirectory');
    if (path) setValue(path);
  };
  
  export const handleBrowseFile = async (setValue: (val: string) => void) => {
    const path = await window.electron.ipcRenderer.invoke('dialog:openFile');
    if (path) setValue(path);
  };