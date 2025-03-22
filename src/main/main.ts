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
type AnnotationType = 'prose' | 'individualPoetry' | 'poetry';
const settingsFilePath = path.join(userDataPath, 'settings.json');

ipcMain.handle('settings:getAnnotationType', async () => {
  if (fs.existsSync(settingsFilePath)) {
    const allSettings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));

    const annotationType = allSettings.currentSession?.annotationType || 'prose'; // Ensure it's pulled from `currentSession`
    console.log("MAIN PROCESS: Annotation Type Retrieved:", annotationType);
    return annotationType; // Return the correct annotationType string
  }

  console.log("MAIN PROCESS: No annotation type found, returning default 'prose'.");
  return 'prose'; // Default to prose if no settings exist
});

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
ipcMain.handle('settings:save', async (_event, { type, settings }) => {
  let existingSettings: Record<string, any> = {};

  if (fs.existsSync(settingsFilePath)) {
    existingSettings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
  }

  if (type === 'currentSession') {
    existingSettings.currentSession = settings;  // Store under currentSession
  } else {
    existingSettings[type] = settings;
  }

  fs.writeFileSync(settingsFilePath, JSON.stringify(existingSettings, null, 2));
  return `Settings for ${type} saved successfully!`;
});

// IPC handler for loading settings
ipcMain.handle('settings:load', async (_event, type) => {
  if (fs.existsSync(settingsFilePath)) {
    const allSettings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
    
    if (type) {
      return allSettings[type] || {};  // Return only requested type
    }
    return allSettings; // Return full settings if no type is specified
  }
  return {};
});

// IPC handler for resetting the current work session
ipcMain.handle('settings:reset', async () => {
  try {
    // Check if settings file exists
    if (!fs.existsSync(settingsFilePath)) return 'No session to reset.';

    // Read current settings
    const existingSettings = JSON.parse(
      fs.readFileSync(settingsFilePath, 'utf-8'),
    );

    // Reset only the session-related data
    existingSettings.currentSession = null; // Clear session tracking
    existingSettings.prose = {}; // Clear prose settings
    existingSettings.individualPoetry = {}; // Clear poetry (individual books) settings
    existingSettings.poetry = {}; // Clear poetry collections settings

    fs.writeFileSync(
      settingsFilePath,
      JSON.stringify(existingSettings, null, 2),
    );

    return 'Work session reset successfully!';
  } catch (error) {
    console.error('Error resetting session:', error);
    throw error;
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
ipcMain.handle('getFoldersWithTxtFiles', async (_event, { type, booksDir }) => {
  console.log("MAIN PROCESS: booksDir received:", booksDir);

  if (!fs.existsSync(booksDir)) {
    console.error("ERROR: booksDir does not exist!", booksDir);
    return [];
  }

  let settings: Record<string, any> = {}; // Use a generic object type

  try {
    settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
  } catch (error) {
    console.error("ERROR: Failed to read settings file:", error);
    return [];
  }

  const annotationType = settings.currentSession?.annotationType || type || 'prose';
  const annotationsCsvPath = settings[annotationType]?.annotationsCsv;

  if (!annotationsCsvPath || !fs.existsSync(annotationsCsvPath)) {
    console.warn("WARNING: No valid annotation file found for", annotationType);
    return [];
  }

  const directories = fs
    .readdirSync(booksDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => path.join(booksDir, dirent.name));

  console.log(`MAIN: Found subdirectories in ${booksDir}:`, directories);

  const foldersWithCompletion = directories.map((dir) => {
    const folderName = path.basename(dir);
    const txtFiles = fs.readdirSync(dir).filter((file) => file.endsWith('.txt'));

    console.log(`MAIN: Inside ${dir}, found txt files:`, txtFiles);

    let annotatedPages = 0;

    if (fs.existsSync(annotationsCsvPath)) {
      const annotations = fs.readFileSync(annotationsCsvPath, 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const annotationSet = new Set();

      annotations.forEach((line) => {
        const [id, page] = line.split(',').map(s => s.trim());
        if (id === folderName && txtFiles.includes(page)) {
          annotationSet.add(page);
        }
      });

      annotatedPages = annotationSet.size;
    }

    const completion = txtFiles.length
      ? Math.round((annotatedPages / txtFiles.length) * 100)
      : 0;

    return { folder: folderName, completion };
  });

  console.log("MAIN: Returning folders with completion data:", foldersWithCompletion);

  return foldersWithCompletion;
});

ipcMain.handle('loadMetadata', async () => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

  if (settings.metadataFilePath && fs.existsSync(settings.metadataFilePath)) {
    return new Promise((resolve, reject) => {
      const metadataJson: any = {};
      const bookIdColumn = settings.bookIdColumn || '';

      fs.createReadStream(settings.metadataFilePath)
        .pipe(csvParser())
        .on('data', (row) => {
          const bookId = row[bookIdColumn];
          if (bookId) {
            metadataJson[bookId] = row;
          }
        })
        .on('end', () => {
          resolve(metadataJson);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  } else {
    return {}; // No metadata available
  }
});

// IPC handler to get the contents of .txt files within a folder aka book pages
ipcMain.handle('getBookContents', async (_event, bookId) => {
  if (!fs.existsSync(settingsFilePath)) {
    console.error("ERROR: Settings file not found.");
    return [];
  }

  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
  const annotationType = settings.currentSession?.annotationType || 'prose'; // Use currentSession.annotationType

  const booksDir = settings[annotationType]?.collectionsDir; // Use the correct booksDir for prose/poetry
  if (!booksDir) {
    console.error(`ERROR: collectionsDir not found for ${annotationType}`);
    return [];
  }

  const bookFolderPath = path.join(booksDir, bookId);
  if (!fs.existsSync(bookFolderPath)) {
    console.error(`ERROR: Book folder does not exist: ${bookFolderPath}`);
    return [];
  }

  const files = fs.readdirSync(bookFolderPath).filter((file) => file.endsWith('.txt'));
  const pages = files.map((file) => {
    const content = fs.readFileSync(path.join(bookFolderPath, file), 'utf-8');
    return { fileName: file, content };
  });

  console.log(`MAIN: Loaded ${pages.length} pages for book: ${bookId}`);
  return pages;
});

// IPC handler to save annotation, ensuring it's stored in the correct annotation type
ipcMain.handle('saveAnnotation', async (_event, { bookId, page, state }) => {
  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
  const annotationType = settings.currentSession?.annotationType || 'prose'; // Default to prose if no session
  const annotationsCsvPath = settings[annotationType]?.annotationsCsv;

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

  // Write back to the correct CSV
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

ipcMain.handle('loadAnnotations', async (_event, { bookId }) => {
  if (!fs.existsSync(settingsFilePath)) {
    console.error("ERROR: Settings file not found.");
    return [];
  }

  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
  const annotationType = settings.currentSession?.annotationType || 'prose'; // Ensure we get the correct type

  const annotationsCsvPath = settings[annotationType]?.annotationsCsv;
  if (!annotationsCsvPath) {
    console.error(`ERROR: Annotations CSV path is not set for ${annotationType}`);
    return [];
  }

  if (!fs.existsSync(annotationsCsvPath)) {
    console.warn(`WARNING: Annotations CSV file does not exist: ${annotationsCsvPath}`);
    return [];
  }

  const annotations = fs.readFileSync(annotationsCsvPath, 'utf-8')
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
ipcMain.handle('loadVolumeNotes', async (_event, { bookId }) => {
  if (!fs.existsSync(settingsFilePath)) {
    console.error("ERROR: Settings file not found.");
    return '';
  }

  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
  const annotationType = settings.currentSession?.annotationType || 'prose'; // Use correct annotation type

  const volumeNotesCsvPath = settings[annotationType]?.volumeNotesCsv;
  if (!volumeNotesCsvPath) {
    console.error(`ERROR: Volume notes CSV path is not set for ${annotationType}`);
    return '';
  }

  if (!fs.existsSync(volumeNotesCsvPath)) {
    console.warn(`WARNING: Volume notes CSV file does not exist: ${volumeNotesCsvPath}`);
    return '';
  }

  const notes = fs.readFileSync(volumeNotesCsvPath, 'utf-8')
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
  if (!fs.existsSync(settingsFilePath)) {
    console.error("ERROR: Settings file not found.");
    return `Error: Settings file not found.`;
  }

  const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
  const annotationType = settings.currentSession?.annotationType || 'prose'; // Correctly retrieve annotation type

  const volumeNotesCsvPath = settings[annotationType]?.volumeNotesCsv;
  if (!volumeNotesCsvPath) {
    console.error(`ERROR: Volume notes CSV path is not set for ${annotationType}`);
    return `Error: Volume notes CSV path is not set for ${annotationType}`;
  }

  let notes: string[] = [];
  if (fs.existsSync(volumeNotesCsvPath)) {
    notes = fs.readFileSync(volumeNotesCsvPath, 'utf-8')
      .split('\n')
      .filter((line) => line.trim() !== '');
  }

  // Remove old note if it exists
  const updatedNotes = notes.filter((line) => !line.startsWith(bookId));
  if (note.trim()) {
    updatedNotes.push(`${bookId},${note}`);
  }

  fs.writeFileSync(volumeNotesCsvPath, updatedNotes.join('\n'));
  return `Volume note saved successfully for ${annotationType}!`;
});

// IPC handler to clear volume notes
ipcMain.handle('clearVolumeNotes', async (_event, { bookId }) => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');

  if (!fs.existsSync(settingsPath)) {
    throw new Error('Settings file does not exist.');
  }

  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  const annotationType = settings.currentSession?.annotationType || 'prose'; // ✅ Get current annotation type
  const volumeNotesCsvPath = settings[annotationType]?.volumeNotesCsv; // ✅ Use correct annotation type

  if (!volumeNotesCsvPath) {
    throw new Error(`Volume notes CSV path is not set for ${annotationType}.`);
  }

  if (!fs.existsSync(volumeNotesCsvPath)) {
    return `No volume notes found to clear for ${annotationType}.`;
  }

  const notes = fs
    .readFileSync(volumeNotesCsvPath, 'utf-8')
    .split('\n')
    .filter((line) => line.trim() !== '' && !line.startsWith(bookId));

  fs.writeFileSync(volumeNotesCsvPath, notes.join('\n'));

  return `Volume note cleared successfully for ${annotationType}!`;
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
