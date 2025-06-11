const { app, BrowserWindow, globalShortcut, screen } = require("electron");
const waitOn = require("wait-on");

let mainWindow;
let isVisible = true;

app.whenReady().then(async () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // ⏳ Wait for Vite dev server to be ready
  console.log("⏳ Waiting for Vite frontend to start...");
  try {
    await waitOn({ resources: ['http://localhost:3000'], timeout: 30000 });
    console.log("✅ Vite frontend is ready.");
  } catch (error) {
    console.error("❌ Vite frontend did not start:", error);
    app.quit();
    return;
  }

  // 🪟 Create transparent overlay window
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
    backgroundColor: '#00000000', // Fully transparent
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 🖱 Allow full screen click-through except "pointer-events: auto" in React
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // 🧠 Load frontend
  mainWindow.loadURL("http://localhost:3000");

  // 🔄 Optional: wait for frontend to fully load
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("✅ Casper overlay UI fully loaded.");
  });

  // ⌨️ Global hotkey to toggle visibility
  globalShortcut.register('Control+Shift+C', () => {
    isVisible = !isVisible;
    isVisible ? mainWindow.show() : mainWindow.hide();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
