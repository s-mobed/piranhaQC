import type { CsvFileData } from "./shared/types";

declare global {
    interface Window { electronAPI: {
        openFolder: () => Promise<CsvFileData[]>;
        saveFile: (file: CsvFileData) => Promise<boolean>;
        };
    }
}
const BARCODE_HEADERS = ["sample","date","institute"]
// add run wide header later for run wide page

let currentFile: CsvFileData | null = null
let currentRowIndex = 0;

const openBtn = document.getElementById("open-folder-btn")!;
const prevBtn = document.getElementById("prev-btn")!;
const nextBtn = document.getElementById("next-btn")!;
const saveBtn = document.getElementById("save-btn")!;
const formContainer = document.getElementById("row-form")!;
const statusE1 = document.getElementById("status")!;

openBtn.addEventListener("click", async () => {
    const files = await window.electronAPI.openFolder();
    if (files.length === 0) {
        currentFile = null;
        statusE1.textContent = "detailed run report not found in folder";
        formContainer.innerHTML = "";
        return;
    }
    currentFile = files[0]
    currentRowIndex = 0
    renderRow();
});

prevBtn.addEventListener("click", () => {
    if (!currentFile) return;
    captureFormValues();
    if (currentRowIndex > 0) currentRowIndex --;
    renderRow();
});

nextBtn.addEventListener("click", () => {
    if (!currentFile) return;
    captureFormValues();
    if (currentRowIndex < currentFile.rows.length -1) currentRowIndex ++;
    renderRow();
});

saveBtn.addEventListener("click", async () => {
    if (!currentFile) return;
    captureFormValues();
    await window.electronAPI.saveFile(currentFile);
    statusE1.textContent = `Save ${currentFile.fileName}`;
});

function renderRow() {
    if (!currentFile) {
    formContainer.innerHTML = "<p>No Folder loaded</p>";
    return;
    }
    const row = currentFile.rows[currentRowIndex];

    formContainer.innerHTML = "";
    for (const header of BARCODE_HEADERS) {
        if (!currentFile.headers.includes(header)) continue;

        const label = document.createElement("label");
        label.textContent = header;

        const input = document.createElement("input");
        input.value = row[header] ?? "";
        input.dataset.field = header;
        // flag missing/empty fields
        input.style.borderColor = input.value.trim() === "" ? "red" : "";

        label.appendChild(input);
        formContainer.appendChild(label);
    }

    statusE1.textContent = `${currentFile.fileName} - row ${currentRowIndex + 1}/${currentFile.rows.length};`
}

function captureFormValues() {
    if (!currentFile) return;
    const row = currentFile.rows[currentRowIndex];
    const inputs = formContainer.querySelectorAll<HTMLInputElement>("input[data-field]");
    inputs.forEach((input) => {
        row[input.dataset.field!] = input.value;
    });
}