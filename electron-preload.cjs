const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('recordLabelDesktop', {
  loadSave: () => ipcRenderer.invoke('save:load'),
  saveGame: data => ipcRenderer.invoke('save:write', data),
  clearSave: () => ipcRenderer.invoke('save:clear')
});
