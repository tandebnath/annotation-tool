import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import fs from 'fs';

import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import csvParser from 'csv-parser';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

const userDataPath = app.getPath('userData');
const settingsFilePath = path.join(userDataPath, 'settings.json');

// IPC handler for opening a directory
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  return result.filePaths[0] || '';
});

// IPC handler for opening a file
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
  });
  return result.filePaths[0] || '';
});

// IPC handler for saving settings
ipcMain.handle('settings:save', async (_event, settings) => {
  fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
  return 'Settings saved successfully!';
});

// IPC handler for loading settings
ipcMain.handle('settings:load', async () => {
  if (fs.existsSync(settingsFilePath)) {
    const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
    return settings;
  } else {
    return {};
  }
});

ipcMain.handle('getCsvColumns', async (_event, csvFilePath) => {
  try {
    const columns: any = [];

    if (!fs.existsSync(csvFilePath)) {
      throw new Error('CSV file does not exist');
    }

    const fileStream = fs.createReadStream(csvFilePath);
    const parser = csvParser();

    fileStream.pipe(parser);

    return new Promise((resolve, reject) => {
      parser.on('headers', (headers) => {
        columns.push(...headers);
        resolve(columns);
      });

      parser.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error extracting columns:', error);
    throw error;
  }
});

// IPC handler to get folders with .txt files and their completion percentages
ipcMain.handle('getFoldersWithTxtFiles', async (_event, booksDir) => {
  if (!fs.existsSync(booksDir)) {
    return [];
  }

  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  const annotationsCsvPath = settings.annotationsCsv;

  const directories = fs
    .readdirSync(booksDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => path.join(booksDir, dirent.name));

  const foldersWithCompletion = directories.map((dir) => {
    const folderName = path.basename(dir);
    const txtFiles = fs
      .readdirSync(dir)
      .filter((file) => file.endsWith('.txt'));

    let annotatedPages = 0;

    if (fs.existsSync(annotationsCsvPath)) {
      const annotations = fs
        .readFileSync(annotationsCsvPath, 'utf-8')
        .split('\n')
        .filter((line) => line.trim() !== '');

      const annotationSet = new Set();

      annotations.forEach((line) => {
        const [id, page] = line.split(',');
        if (id === folderName && txtFiles.includes(page.trim())) {
          annotationSet.add(page.trim());
        }
      });

      annotatedPages = annotationSet.size;
    }

    const completion = txtFiles.length
      ? Math.round((annotatedPages / txtFiles.length) * 100)
      : 0;

    return { folder: folderName, completion };
  });

  return foldersWithCompletion;
});

// IPC handler to get the contents of .txt files within a folder aka book pages
ipcMain.handle('getBookContents', async (_event, bookId) => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

  const booksDir = settings.booksDir;
  const bookFolderPath = path.join(booksDir, bookId);

  if (!fs.existsSync(bookFolderPath)) {
    return [];
  }

  const files = fs
    .readdirSync(bookFolderPath)
    .filter((file) => file.endsWith('.txt'));

  const pages = files.map((file) => {
    const content = fs.readFileSync(path.join(bookFolderPath, file), 'utf-8');
    return {
      fileName: file, // The .txt file name (e.g., "001.txt")
      content: content, // The content of the .txt file
    };
  });

  return pages;
});

ipcMain.handle('saveAnnotation', async (_event, { bookId, page, state }) => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

  const annotationsCsvPath = settings.annotationsCsv;
  if (!annotationsCsvPath) {
    throw new Error('Annotations CSV path is not set.');
  }

  let annotations: { csvBookId: string; csvPage: string; csvState: string }[] =
    [];

  if (fs.existsSync(annotationsCsvPath)) {
    annotations = fs
      .readFileSync(annotationsCsvPath, 'utf-8')
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => {
        const [csvBookId, csvPage, csvState] = line.split(',');
        return { csvBookId, csvPage, csvState };
      });
  }

  // Update the annotation if it exists, otherwise add a new one
  const existingAnnotation = annotations.find(
    (annotation) =>
      annotation.csvBookId === bookId && annotation.csvPage === page,
  );

  if (existingAnnotation) {
    existingAnnotation.csvState = state;
  } else {
    annotations.push({ csvBookId: bookId, csvPage: page, csvState: state });
  }

  // Write back to the CSV
  fs.writeFileSync(
    annotationsCsvPath,
    annotations
      .map(
        ({ csvBookId, csvPage, csvState }) =>
          `${csvBookId},${csvPage},${csvState}`,
      )
      .join('\n'),
  );

  return 'Annotation saved successfully!';
});

ipcMain.handle('loadAnnotations', async (_event, bookId) => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

  const annotationsCsvPath = settings.annotationsCsv;
  if (!annotationsCsvPath) {
    throw new Error('Annotations CSV path is not set.');
  }

  if (!fs.existsSync(annotationsCsvPath)) {
    return [];
  }

  const annotations = fs
    .readFileSync(annotationsCsvPath, 'utf-8')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [csvBookId, csvPage, csvState] = line.split(',');
      return { bookId: csvBookId, page: csvPage, state: csvState };
    });

  return annotations.filter((annotation) => annotation.bookId === bookId);
});

/*

-------- Volume Notes Handlers ----------

*/

// IPC handler to load volume notes
ipcMain.handle('loadVolumeNotes', async (_event, bookId) => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

  const volumeNotesCsvPath = settings.volumeNotesCsv;
  if (!volumeNotesCsvPath) {
    throw new Error('Volume notes CSV path is not set.');
  }

  if (!fs.existsSync(volumeNotesCsvPath)) {
    return '';
  }

  const notes = fs
    .readFileSync(volumeNotesCsvPath, 'utf-8')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [csvBookId, note] = line.split(',');
      return { bookId: csvBookId, note };
    });

  const note = notes.find((n) => n.bookId === bookId);
  return note ? note.note : '';
});

// IPC handler to save volume notes
ipcMain.handle('saveVolumeNotes', async (_event, { bookId, note }) => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

  const volumeNotesCsvPath = settings.volumeNotesCsv;
  if (!volumeNotesCsvPath) {
    throw new Error('Volume notes CSV path is not set.');
  }

  let notes: any = [];
  if (fs.existsSync(volumeNotesCsvPath)) {
    notes = fs
      .readFileSync(volumeNotesCsvPath, 'utf-8')
      .split('\n')
      .filter((line) => line.trim() !== '');
  }

  const updatedNotes = notes.filter((line: any) => !line.startsWith(bookId));
  if (note.trim()) {
    updatedNotes.push(`${bookId},${note}`);
  }

  fs.writeFileSync(volumeNotesCsvPath, updatedNotes.join('\n'));
  return 'Volume note saved successfully!';
});

// IPC handler to clear volume notes
ipcMain.handle('clearVolumeNotes', async (_event, bookId) => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

  const volumeNotesCsvPath = settings.volumeNotesCsv;
  if (!volumeNotesCsvPath) {
    throw new Error('Volume notes CSV path is not set.');
  }

  if (!fs.existsSync(volumeNotesCsvPath)) {
    return 'No volume notes found to clear.';
  }

  const notes = fs
    .readFileSync(volumeNotesCsvPath, 'utf-8')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .filter((line) => !line.startsWith(bookId));

  fs.writeFileSync(volumeNotesCsvPath, notes.join('\n'));
  return 'Volume note cleared successfully!';
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
