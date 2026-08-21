import { app, BrowserWindow,dialog,ipcMain, webContents } from 'electron';
import * as path from 'path';
import * as fs from "fs/promises";
import { parse } from "csv-parse/sync";
import { stringify } from 'csv-stringify/sync';
import type { CsvFileData } from "./shared/types"

// let win: BrowserWindow | null = null

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
 
    win.loadFile(path.join(__dirname, '..', 'index.html'));
    win.webContents.openDevTools();
}
 
app.whenReady().then(createWindow)
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// Folder Selection and csv parse
ipcMain.handle("folder:open", async (): Promise<CsvFileData[]> => {
    const result = await dialog.showOpenDialog({properties: ['openDirectory'], title: 'Select Folder'});
    if (result.canceled) return [];
    
    const folderPath = result.filePaths[0]
    const Report = "detailed_run_report.csv"
    const filePath = path.join(folderPath, Report)

    try {
        const content = await fs.readFile(filePath, "utf-8");
        const rows: Record<string, string>[] = parse(content, {
            columns:true,
            skip_empty_lines: true,
        });
        const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
        return [{ filePath, fileName: Report, headers, rows}];
    } catch(err) {
        console.error(`Could not find or read ${Report}:`,err);
        return [];
    }
});

// Minknow file selection
ipcMain.handle("file:open", async () => {

});
// Save file
ipcMain.handle("file:save", async (_event, file: CsvFileData) => {
    const csvText = stringify(file.rows, {header: true, columns: file.headers});
    await fs.writeFile(file.filePath, csvText, "utf-8");
    return true;
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});