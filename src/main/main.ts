import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import fs from 'fs';

import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import csvParser from 'csv-parser';
import { validateSettings } from '../renderer/utils/settings/validateSettings';

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
  if (!fs.existsSync(settingsFilePath)) return '';

  const allSettings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
  const annotationType = allSettings.annotationType;
  const settings = allSettings.settings;

  const isValid =
    (annotationType === 'prose' || annotationType === 'poetry') &&
    validateSettings(settings);

  return isValid ? annotationType : '';
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
ipcMain.handle(
  'settings:save',
  async (_event, { annotationType, settings }) => {
    const newSettings = {
      annotationType,
      settings,
    };

    fs.writeFileSync(settingsFilePath, JSON.stringify(newSettings, null, 2));
    return `Settings saved successfully for ${annotationType}.`;
  },
);

// IPC handler for loading settings
ipcMain.handle('settings:load', async () => {
  if (!fs.existsSync(settingsFilePath)) return {};

  const { annotationType, settings } = JSON.parse(
    fs.readFileSync(settingsFilePath, 'utf-8'),
  );

  if (annotationType === 'prose' || annotationType === 'poetry') {
    return {
      annotationType,
      ...settings,
    };
  }

  return {};
});

ipcMain.handle('settings:reset', async () => {
  try {
    if (!fs.existsSync(settingsFilePath)) return 'No session to reset.';

    // Simply overwrite with empty structure
    const resetState = {
      annotationType: '',
      settings: {},
    };

    fs.writeFileSync(settingsFilePath, JSON.stringify(resetState, null, 2));

    return 'Work session reset successfully!';
  } catch (error) {
    console.error('Error resetting session:', error);
    throw error;
  }
});

ipcMain.handle('getCsvColumns', async (_event, csvFilePath: string) => {
  try {
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file does not exist: ${csvFilePath}`);
    }

    const fileStream = fs.createReadStream(csvFilePath);
    const parser = csvParser();

    return new Promise<string[]>((resolve, reject) => {
      parser.on('headers', (headers) =>
        resolve(headers.map((h: any) => h.replace(/^\uFEFF/, '').trim())),
      );
      parser.on('error', (error) => reject(error));
      fileStream.pipe(parser);
    });
  } catch (error) {
    console.error('Error extracting CSV columns:', error);
    throw error;
  }
});

// IPC handler to get folders with .txt files and their completion percentages
ipcMain.handle('getFoldersWithTxtFiles', async (_event, booksDir: string) => {
  console.log('MAIN: booksDir received:', booksDir);

  if (!fs.existsSync(booksDir)) {
    console.error('ERROR: booksDir does not exist!', booksDir);
    return [];
  }

  let annotationType: string = '';
  let settings: Record<string, any> = {};

  try {
    const allSettings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
    annotationType = allSettings.annotationType;
    settings = allSettings.settings || {};
    console.log('MAIN: Loaded annotationType:', annotationType);
    console.log('MAIN: Loaded settings:', settings);
  } catch (error) {
    console.error('ERROR: Failed to read settings file:', error);
    return [];
  }

  const annotationsCsvPath = settings.annotationsCsv;
  const labelCategories = settings.labelCategories || [];
  const totalCategories = labelCategories.length;

  if (!annotationsCsvPath || !fs.existsSync(annotationsCsvPath)) {
    console.warn('WARNING: annotationsCsv missing or does not exist');
  }

  let csvLines: string[] = [];
  if (annotationsCsvPath && fs.existsSync(annotationsCsvPath)) {
    csvLines = fs
      .readFileSync(annotationsCsvPath, 'utf-8')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  const completionMap = new Map<string, number>();

  if (csvLines.length > 0) {
    const header = csvLines[0].split(',');
    const dataRows = csvLines.slice(1).map((line) => line.split(','));
    const bookIdCol = 0;
    const categoryColsStart = annotationType === 'prose' ? 2 : 1;

    for (const row of dataRows) {
      const bookId = row[bookIdCol];
      if (!bookId) continue;

      let filled = 0;
      for (let i = categoryColsStart; i < header.length; i++) {
        const val = (row[i] || '').trim();
        if (val.length > 0) {
          filled += 1;
        }
      }

      const existing = completionMap.get(bookId) || 0;
      completionMap.set(bookId, Math.max(existing, filled));
    }
  } else {
    console.warn(
      'WARNING: annotationsCsv file is empty. Defaulting to 0% completion.',
    );
  }

  const subdirs = fs
    .readdirSync(booksDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => path.join(booksDir, dirent.name));

  const foldersWithCompletion = subdirs.map((dir) => {
    const folderName = path.basename(dir);
    const filled = completionMap.get(folderName) || 0;

    const completion =
      totalCategories > 0 ? Math.round((filled / totalCategories) * 100) : 0;

    return { folder: folderName, completion };
  });

  console.log(
    'MAIN: Returning folders with completion data:',
    foldersWithCompletion,
  );
  return foldersWithCompletion;
});

ipcMain.handle('loadMetadata', async () => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  const allSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  const settings = allSettings.settings || {};
  const volumeIdColumn = settings.volumeIdColumn || '';

  if (settings.metadataFilePath && fs.existsSync(settings.metadataFilePath)) {
    return new Promise((resolve, reject) => {
      const metadataJson: any = {};
      let cleanedVolumeIdColumn = volumeIdColumn.replace(/^\uFEFF/, '').trim();

      fs.createReadStream(settings.metadataFilePath)
        .pipe(csvParser())
        .on('headers', (headers) => {
          // Strip BOM from headers
          for (let i = 0; i < headers.length; i++) {
            headers[i] = headers[i].replace(/^\uFEFF/, '').trim();
          }
        })
        .on('data', (row) => {
          const volumeId = row[cleanedVolumeIdColumn];
          console.log('Adding metadata for:', volumeId);
          if (volumeId) {
            metadataJson[volumeId] = row;
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
    console.error('ERROR: Settings file not found.');
    return [];
  }

  let settings: Record<string, any> = {};

  try {
    const allSettings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
    settings = allSettings.settings || {};
  } catch (error) {
    console.error('ERROR: Failed to parse settings file:', error);
    return [];
  }

  if (!settings.collectionsDir) {
    console.error('ERROR: collectionsDir not defined in settings.');
    return [];
  }

  const bookFolderPath = path.join(settings.collectionsDir, bookId);

  if (!fs.existsSync(bookFolderPath)) {
    console.error(`ERROR: Book folder does not exist: ${bookFolderPath}`);
    return [];
  }

  const files = fs
    .readdirSync(bookFolderPath)
    .filter((file) => file.endsWith('.txt'));

  const pages = files.map((file) => {
    const content = fs.readFileSync(path.join(bookFolderPath, file), 'utf-8');
    return { fileName: file, content };
  });

  console.log(`MAIN: Loaded ${pages.length} pages for book: ${bookId}`);
  return pages;
});

// IPC handler to save annotation, ensuring it's stored in the correct annotation type

ipcMain.handle(
  'saveAnnotation',
  async (_event, { type, bookId, page, state, category }) => {
    if (!fs.existsSync(settingsFilePath)) {
      throw new Error('Settings file not found.');
    }

    const { settings } = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
    const csvPath = settings?.annotationsCsv;
    if (!csvPath) throw new Error('Annotations CSV path not set.');

    // Load existing rows
    let rows: string[][] = [];
    if (fs.existsSync(csvPath)) {
      rows = fs
        .readFileSync(csvPath, 'utf-8')
        .split('\n')
        .filter(Boolean)
        .map((line) => line.split(','));
    }

    let header: string[];
    if (rows.length === 0) {
      header = type === 'prose' ? ['ID', 'page', category] : ['ID', category];
    } else {
      header = [...rows[0]];
      if (!header.includes(category)) {
        header.push(category);
      }
    }

    const dataRows = rows.slice(1);
    const newRows: string[][] = [];
    let updated = false;

    for (const row of dataRows) {
      const rowId = row[0];
      const rowPage = type === 'prose' ? row[1] : '';
      const isMatch =
        type === 'prose'
          ? rowId === bookId && rowPage === page
          : rowId === bookId;

      if (isMatch) {
        const rowCopy = [...row];
        while (rowCopy.length < header.length) rowCopy.push('');
        const colIndex = header.indexOf(category);

        if (state) {
          const existing = rowCopy[colIndex] || '';
          const parts = existing
            ? existing.split(';').map((s) => s.trim())
            : [];

          if (!parts.includes(state)) {
            parts.push(state);
            rowCopy[colIndex] = parts.join(';');
          }
        } else {
          rowCopy[colIndex] = '';
        }

        newRows.push(rowCopy);
        updated = true;
      } else {
        newRows.push(row);
      }
    }

    if (!updated) {
      const row: string[] = Array(header.length).fill('');
      row[0] = bookId;
      if (type === 'prose') row[1] = page;
      const colIndex = header.indexOf(category);
      row[colIndex] = state ? state : '';

      newRows.push(row);
    }

    const allRows = [header, ...newRows];
    fs.writeFileSync(csvPath, allRows.map((row) => row.join(',')).join('\n'));

    return 'Annotation saved successfully!';
  },
);

ipcMain.handle('loadAnnotations', async (_event, { bookId }) => {
  console.log('--- LOAD ANNOTATIONS ---');
  console.log('Book ID:', bookId);

  if (!fs.existsSync(settingsFilePath)) {
    console.warn('Settings file not found.');
    return [];
  }

  const { annotationType, settings } = JSON.parse(
    fs.readFileSync(settingsFilePath, 'utf-8'),
  );
  const csvPath = settings?.annotationsCsv;
  console.log('Annotation Type:', annotationType);
  console.log('CSV Path:', csvPath);

  if (!csvPath || !fs.existsSync(csvPath)) {
    console.warn('Annotations CSV path is missing or does not exist.');
    return [];
  }

  const raw = fs.readFileSync(csvPath, 'utf-8');
  const lines = raw.split('\n').filter(Boolean);

  if (lines.length < 1) {
    console.warn('No annotation data rows found.');
    return [];
  }

  // Parse standard CSV (assuming no quotes or special characters)
  const parseCsvLine = (line: string): string[] => {
    return line.split(',').map((s) => s.trim());
  };

  const header = parseCsvLine(lines[0]);
  const dataRows = lines.slice(1).map(parseCsvLine);

  console.log('CSV Header:', header);
  console.log('CSV Data Rows:', dataRows);

  const annotations: {
    bookId: string;
    page: string;
    state: string;
    category: string;
  }[] = [];

  for (const row of dataRows) {
    if (row[0] !== bookId) continue;

    if (annotationType === 'prose') {
      const page = row[1];
      for (let i = 2; i < header.length; i++) {
        const category = header[i];
        const cell = row[i] || '';
        const states = cell
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean);

        for (const state of states) {
          annotations.push({ bookId, page, state, category });
        }
      }
    }

    if (annotationType === 'poetry') {
      for (let i = 1; i < header.length; i++) {
        const category = header[i];
        const cell = row[i] || '';
        const states = cell
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean);

        for (const state of states) {
          annotations.push({
            bookId,
            page: 'poetry',
            state,
            category,
          });
        }
      }
    }
  }

  console.log('Final loaded annotations:', annotations);
  console.log('--- END LOAD ---');

  return annotations;
});

ipcMain.handle('annotations:getUsedLabels', async () => {
  if (!fs.existsSync(settingsFilePath)) {
    console.warn('Settings file not found.');
    return {};
  }

  const { annotationType, settings } = JSON.parse(
    fs.readFileSync(settingsFilePath, 'utf-8'),
  );

  const annotationsCsvPath = settings?.annotationsCsv;
  if (!annotationsCsvPath || !fs.existsSync(annotationsCsvPath)) {
    console.warn('Annotations CSV missing or does not exist.');
    return {};
  }

  const raw = fs.readFileSync(annotationsCsvPath, 'utf-8');
  const lines = raw.split('\n').filter(Boolean);
  if (lines.length < 2) return {};

  const header = lines[0].split(',').map((h) => h.trim());
  const dataRows = lines.slice(1).map((line) => line.split(','));

  const usedLabelsMap: Record<
    string, // bookId
    Record<string, Set<string>> // category -> Set<label>
  > = {};

  for (const row of dataRows) {
    const bookId = row[0];
    if (!bookId) continue;

    const startCol = annotationType === 'prose' ? 2 : 1;

    for (let i = startCol; i < header.length; i++) {
      const category = header[i];
      const rawCell = row[i] || '';
      const labels = rawCell
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);

      if (!usedLabelsMap[bookId]) {
        usedLabelsMap[bookId] = {};
      }

      if (!usedLabelsMap[bookId][category]) {
        usedLabelsMap[bookId][category] = new Set();
      }

      labels.forEach((label) => {
        usedLabelsMap[bookId][category].add(label);
      });
    }
  }

  // Convert Sets to Arrays for transport over IPC
  const result = Object.fromEntries(
    Object.entries(usedLabelsMap).map(([bookId, catMap]) => [
      bookId,
      Object.fromEntries(
        Object.entries(catMap).map(([cat, labelSet]) => [cat, [...labelSet]]),
      ),
    ]),
  );

  return result;
});

/*

-------- Volume Notes Handlers ----------

*/

// IPC handler to load volume notes
ipcMain.handle('loadNotes', async (_event, { bookId }) => {
  if (!fs.existsSync(settingsFilePath)) {
    console.error('ERROR: Settings file not found.');
    return '';
  }

  const { settings } = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
  const notesCsvPath = settings?.notesCsv;

  if (!notesCsvPath) {
    console.error('ERROR: notesCsv path is not set.');
    return '';
  }

  if (!fs.existsSync(notesCsvPath)) {
    console.warn(`WARNING: notesCsv file does not exist: ${notesCsvPath}`);
    return '';
  }

  const lines = fs
    .readFileSync(notesCsvPath, 'utf-8')
    .split('\n')
    .filter((line) => line.trim() !== '');

  const entry = lines.find((line) => line.startsWith(`${bookId},`));
  return entry ? entry.substring(bookId.length + 1) : '';
});

// IPC handler to save volume notes
ipcMain.handle('saveNotes', async (_event, { bookId, note }) => {
  if (!fs.existsSync(settingsFilePath)) {
    throw new Error('Settings file not found.');
  }

  const { settings } = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
  const notesCsvPath = settings?.notesCsv;

  if (!notesCsvPath) {
    throw new Error('notesCsv path is not set.');
  }

  let lines: string[] = [];
  let hasHeader = false;

  if (fs.existsSync(notesCsvPath)) {
    const rawLines = fs
      .readFileSync(notesCsvPath, 'utf-8')
      .split('\n')
      .filter(Boolean);
    if (rawLines.length > 0 && rawLines[0].startsWith('volumeId')) {
      hasHeader = true;
      lines = rawLines.slice(1); // exclude header
    } else {
      lines = rawLines;
    }
  }

  const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;

  // Filter out existing note for the bookId
  const filtered = lines.filter((line) => !line.startsWith(`${bookId},`));
  if (note.trim()) {
    filtered.push(`${bookId},${escapeCsv(note)}`);
  }

  const newLines = ['volumeId,note', ...filtered];
  fs.writeFileSync(notesCsvPath, newLines.join('\n'));

  return 'Note saved successfully!';
});

// IPC handler to clear volume notes
ipcMain.handle('clearNotes', async (_event, { bookId }) => {
  if (!fs.existsSync(settingsFilePath)) {
    throw new Error('Settings file does not exist.');
  }

  const { settings } = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
  const notesCsvPath = settings?.notesCsv;

  if (!notesCsvPath) {
    throw new Error('notesCsv path is not set.');
  }

  if (!fs.existsSync(notesCsvPath)) {
    return 'No notes file found to clear.';
  }

  const lines = fs
    .readFileSync(notesCsvPath, 'utf-8')
    .split('\n')
    .filter((line) => line.trim() !== '' && !line.startsWith(`${bookId},`));

  fs.writeFileSync(notesCsvPath, lines.join('\n'));
  return 'Note cleared successfully!';
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
    icon: path.join(
      __dirname,
      '../../assets',
      process.platform === 'darwin'
        ? 'icon.icns'
        : process.platform === 'win32'
          ? 'icon.ico'
          : 'icon.png',
    ),
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
