const { app, BrowserWindow, globalShortcut, screen } = require("electron");
const waitOn = require("wait-on");

let mainWindow;
let isVisible = true;

app.whenReady().then(async () => {
  // ✅ Get screen size AFTER app is ready
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // ⏳ Wait for Vite dev server
  await waitOn({ resources: ['http://localhost:3000'], timeout: 30000 });

  // ✅ Create the Casper overlay window
  mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    resizable: false,
    fullscreen: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    vibrancy: 'fullscreen-ui',
    visualEffectState: 'active',
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Let interactions pass through except for dropdown
  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.loadURL("http://localhost:3000");

  // Toggle visibility with hotkey
  globalShortcut.register('Control+Shift+C', () => {
    isVisible = !isVisible;
    isVisible ? mainWindow.show() : mainWindow.hide();
  });
});

// Clean up on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
