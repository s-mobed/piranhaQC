// Shared names
export interface CsvRow {
[field: string]: string;
}

export interface CsvFileData {
    filePath: string;
    fileName: string;
    headers: string[];
    rows: CsvRow[];
}

export const IPC = {
    OPEN_FOLDER: "folder:open",
    SAVE_FILE: "file:save",
} as const;