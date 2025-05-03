import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, Menu, protocol, shell, screen } from 'electron';
import defaultMenu from 'electron-default-menu';
import { createHandler } from 'next-electron-rsc';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
process.env.ELECTRON_ENABLE_LOGGING = 'true';

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

const isDev = process.env.NODE_ENV === 'development';
const appPath = app.getAppPath();
const standaloneDir = path.join(appPath, '.next', 'standalone');
const nextjsHostUrl = 'http://localhost:3000';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let stopIntercept: (() => void) | null = null;

const { createInterceptor } = createHandler({
  standaloneDir,
  localhostUrl: nextjsHostUrl,
  protocol,
  debug: true,
});

const createWindow = async () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  mainWindow = new BrowserWindow({
    titleBarStyle: 'hidden',
    title: 'Chatbot built with Next.js, Chat SDK and Electron',
    frame: false,
    autoHideMenuBar: true,
    resizable: true,
    width: width,
    height: height,
    webPreferences: {
      contextIsolation: true, // protect against prototype pollution
      devTools: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'public/icons/mac/icon.icns'),
  });

  if (!isDev) {
    console.log(
      `[APP] Server Debugging Enabled, ${nextjsHostUrl} will be intercepted to ${standaloneDir}`,
    );
    stopIntercept = createInterceptor({
      session: mainWindow.webContents.session,
    });

    mainWindow.once('ready-to-show', () =>
      mainWindow?.webContents.openDevTools(),
    );
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopIntercept?.();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch((e) => console.error(e));
    return { action: 'deny' };
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate(defaultMenu(app, shell)));

  await app.whenReady();

  await mainWindow.loadURL(`${nextjsHostUrl}/`);

  console.log('[APP] Loaded', nextjsHostUrl);
};

app.on('ready', createWindow);

app.on('window-all-closed', () => app.quit());

app.on(
  'activate',
  () =>
    BrowserWindow.getAllWindows().length === 0 && !mainWindow && createWindow(),
);
