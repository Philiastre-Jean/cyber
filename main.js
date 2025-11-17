// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      // SECURITY: disable nodeIntegration in renderer, enable contextIsolation
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js') // optional but recommended
    },
    autoHideMenuBar: true
  });

  // load local HTML file
  win.loadFile(path.join(__dirname, 'app', 'index.html'));

  // Open DevTools in development:
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

// macOS behavior (optional)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
