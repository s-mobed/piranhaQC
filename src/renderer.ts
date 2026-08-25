import type { CsvFileData } from "./shared/types";

declare global {
    interface Window { electronAPI: {
        openFolder: () => Promise<CsvFileData[]>;
        openFile: () => Promise<File>;
        saveFile: (file: CsvFileData) => Promise<boolean>;
        };
    }
}

// Split individual sample fields from run wide constants
const BARCODE_HEADERS = ["sample","barcode","IsQCRetest","IfRetestOriginalRun","SampleType","DelaysInProccessingForDDNS","DetailsOfDelays","DateRNAextraction",
                         "ExtractionKit","ExtractionType","DateRTPCR","RTPCRMachine","RTPCRcomments","DatePanEVPCR","PanEVPCRMachine","PanEVprimers","PanEVPCRcomments",
                         "DateVP1PCR","VP1PCRMachine","VP1primers","VP1PCRcomments","PositiveControlPCRCheck","NegativeControlPCRCheck","LibraryPreparationKit","Well",
                         "RunNumber","AnalysisPipelineVersion","RunQC","DDNSclassification","SampleQC", "SampleQCChecksComplete","QCComments",
                         "EmergenceGroupVDPV1","EmergenceGroupVDPV2","EmergenceGroupVDP3"];
  
// EPI INFO if such data is merged with before piranha
const EPIINFO_HEADERS = ["EPID","EpidNumber","CaseOrContact","Country","Province","District","StoolCondition","SpecimenNumber","DateOfOnset","DateStoolCollected",
                         "DateStoolSentfromField","DateStoolReceivedNatLevel","DateStoolSentToLab","DateStoolReceivedinLab","FinalCellCultureResult",
                         "DateFinalCellCultureResults","FinalITDResult","DateFinalrRTPCRResults","DateIsolateSentforSeq","SequenceName","DateSeqResult"]

// Run wide constants to be checked first and applied to whole dataset
const RUNWIDE_HEADERS = ["institute","SequencingLab","ExtractionKit","ExtractionType","RTPCRMachine","RTPCRcomments","DatePanEVPCR","PanEVPCRMachine",
                        "PanEVprimers","PanEVPCRcomments","DateVP1PCR","VP1PCRMachine","VP1primers","VP1PCRcomments","PositiveControlPCRCheck",
                        "NegativeControlPCRCheck","LibraryPreparationKit","RunNumber","AnalysisPipelineVersion","RunQC"]

// Minknow fields, could be extracted from Minknow report and displayed in run wide page
const MINKNOW_HEADERS = ["DateSeqRunLoaded","SequencerUsed","FlowCellVersion","FlowCellID","FlowCellPriorUses","PoresAvilableAtFlowCellCheck",
                         "MinKNOWSoftwareVersion","RunHoursDuration","DateFastaGenerated"];    


let currentFile: CsvFileData | null = null
let currentRowIndex = 0;

// File handling elements
const openFolder = document.getElementById("open-piranha-btn")!;
const openFile = document.getElementById("open-minknow-btn")!;

const reportname = document.getElementById("report-name")!;
const minknowname = document.getElementById("minknow-name")!;

// button elements
const runwideBtn = document.getElementById("runwide-btn")!; // opens run wide page
const homeBtn = document.getElementById("home-btn")!; // returns to homepage
const barcodeBtn = document.getElementById('barcode-btn')!; // opens barcode iteration page
const prevBtn = document.getElementById("prev-btn")!; // changes csv row back
const nextBtn = document.getElementById("next-btn")!; // changes csv row forward
const saveBtn = document.getElementById("save-btn")!; // saves report with QC suffix

// HTML elements
const formContainer = document.getElementById("row-form")!;
const epiContainer = document.getElementById("epi-table")!;
const Table = document.getElementById("table")!;
const statusE1 = document.getElementById("status")!;


// Button Events
openFolder.addEventListener("click", async () => {
    const files = await window.electronAPI.openFolder();
    if (files.length === 0) {
        currentFile = null;
        reportname.textContent = "No file loaded"
        statusE1.textContent = "detailed run report not found in folder";
        formContainer.innerHTML = "";
        return;
    }
    currentFile = files[0]
    reportname.textContent = currentFile.filePath

});

openFile.addEventListener("click", async () => {
    const file = await window.electronAPI.openFile();
    minknowname.textContent = file.name
})

runwideBtn.addEventListener("click", async () => {

    renderCol();
})

barcodeBtn.addEventListener("click",  async () => {
    currentRowIndex = 0
    renderRow();
})


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

// Render Run wide page
function renderCol(){
    if (!currentFile) {
        formContainer.innerHTML = "<p>No Folder loaded</p>";
        return;
    }
    const row = currentFile.rows[currentRowIndex];

    formContainer.innerHTML = "";
    for (const header of RUNWIDE_HEADERS && MINKNOW_HEADERS) {
        // if (!currentFile.headers.includes(header)) continue;

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
    statusE1.textContent = `Displaying Run wide Values`

}
// render EPI INFO in a non changeable format
function renderEPI () {
    if (!currentFile) {
        epiContainer.innerHTML = "<p>No Folder loaded</p>";
        return;
    }
    const row = currentFile.rows[currentRowIndex];

    epiContainer.innerHTML = "";
    for (const header of EPIINFO_HEADERS) {
        // if (!currentFile.headers.includes(header)) continue;

        const wrapper = document.createElement("label");

        const titleSpan = document.createElement("span");
        titleSpan.textContent = header;
        titleSpan.className = "field-title";

        const valueSpan = document.createElement("span");
        valueSpan.textContent = row[header] ?? "";
        valueSpan.className = "field-value";

        wrapper.appendChild(titleSpan);
        wrapper.appendChild(valueSpan);
        epiContainer.appendChild(wrapper);
    }
}

// Render barcode info
function renderRow() {
    if (!currentFile) {
    formContainer.innerHTML = "<p>No Folder loaded</p>";
    return;
    }
    const row = currentFile.rows[currentRowIndex];

    // Show changeable values
    formContainer.innerHTML = "";
    for (const header of BARCODE_HEADERS ) {
        // if (!currentFile.headers.includes(header)) continue;

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

    // Show EPI
    renderEPI();

    // Piranha results
    const TARGETS = ['Sabin1-related','Sabin2-related','Sabin3-related','WPV1','WPV2','WPV3','NonPolioEV','PositiveControl'];
    const FIELDS = ['closest_reference','num_reads','nt_diff_from_reference','pcent_match','classification'];

    if (!currentFile) {
        for (const target of TARGETS) {
            for (const field of FIELDS) {
                const cell = document.getElementById(`cell-${target}-${field}`);
                if (cell) cell.textContent = "";
            }
        }
        return;
    }

    for (const target of TARGETS) {
        for (const field of FIELDS) {
            const headerName = `${target}|${field}`;
            const cell = document.getElementById(`cell-${target}-${field}`);
            if (cell) cell.textContent = row[headerName] ?? "";
        }
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