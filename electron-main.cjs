const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');

let gameServer;
let gameWindow;
let pendingSave = Promise.resolve();
const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) app.quit();
else app.on('second-instance', () => { if (gameWindow) { gameWindow.show(); gameWindow.focus(); } });

async function openGame() {
  const savePath = path.join(app.getPath('userData'), 'game-save.json');
  ipcMain.handle('save:load', async () => {
    await pendingSave;
    try { return await fs.readFile(savePath, 'utf8'); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  });
  ipcMain.handle('save:write', (_event, data) => {
    if (typeof data !== 'string' || data.length > 2_000_000) throw new Error('Invalid save data.');
    pendingSave = pendingSave.catch(() => {}).then(() => fs.writeFile(savePath, data, 'utf8'));
    return pendingSave;
  });
  ipcMain.handle('save:clear', () => {
    pendingSave = pendingSave.catch(() => {}).then(() => fs.rm(savePath, { force:true }));
    return pendingSave;
  });
  const { createGameServer } = await import('./server.mjs');
  gameServer = createGameServer(app.getAppPath());
  await new Promise((resolve, reject) => {
    gameServer.once('error', reject);
    gameServer.listen(0, '127.0.0.1', resolve);
  });
  const origin = `http://127.0.0.1:${gameServer.address().port}`;
  gameWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1000, minHeight: 700,
    title: 'Record Label Rivals', backgroundColor: '#07101b',
    icon: path.join(app.getAppPath(), 'icons', '11-royalties.png'),
    autoHideMenuBar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, preload:path.join(__dirname, 'electron-preload.cjs') }
  });
  gameWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  gameWindow.webContents.on('will-navigate', (event, url) => { if (!url.startsWith(origin + '/')) event.preventDefault(); });
  gameWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') { gameWindow.setFullScreen(!gameWindow.isFullScreen()); event.preventDefault(); }
  });
  await gameWindow.loadURL(origin);
}

if (singleInstance) app.whenReady().then(openGame).catch(error => {
  console.error(error);
  app.quit();
});
app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => { if (gameServer) gameServer.close(); });
