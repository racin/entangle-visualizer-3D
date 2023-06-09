import { COLORS } from "../../SharedKernel/constants";
import { DownloadConfigLog, ParityEvent, VertexEvent } from "../../SharedKernel/interfaces";
import { convertHexToStringColor } from "../../SharedKernel/utils";
import { ChangeViewEvent } from "../events/changeView";
import { LogChangedClickedEvent } from "../events/logChangedClicked";
import { LogEntryEvent } from "../events/logEntryEvents";
import { StatsTable, Slider, LogTable, LogRow } from "./interfaces/interfaces";

export class PlayBack {

    public Container: HTMLDivElement = document.createElement("div");
    private logEntries: (VertexEvent | ParityEvent)[] = [];
    private visible: boolean = false;
    private statsTable: StatsTable = {
        table: document.createElement("table"),
        config: document.createElement("p"),
        fileName: document.createElement("p"),
        header: document.createElement("tr"),
        dlRow: {
            row: document.createElement("tr"),
            type: document.createElement("td"),
            dataCell: document.createElement("td"),
            parityCell: document.createElement("td")},
        repRow: {
            row: document.createElement("tr"),
            type: document.createElement("td"),
            dataCell: document.createElement("td"),
            parityCell: document.createElement("td")},
        failedRow: {
            row: document.createElement("tr"),
            type: document.createElement("td"),
            dataCell: document.createElement("td"),
            parityCell: document.createElement("td")
        },
        failedRepRow: {
            row: document.createElement("tr"),
            type: document.createElement("td"),
            dataCell: document.createElement("td"),
            parityCell: document.createElement("td")
        }
    }
    private JumpBackButton: HTMLButtonElement = document.createElement("button");
    private BackButton: HTMLButtonElement = document.createElement("button");
    private PlayButton: HTMLButtonElement = document.createElement("button");
    private JumpForwardButton: HTMLButtonElement = document.createElement("button");
    private slider: Slider = {
        container: document.createElement("div"),
        input: document.createElement("input"),
        currentPosition: document.createElement("input"),
        endPosition: document.createElement("span")
    };
    private logTable: LogTable = {
        table: document.createElement("table"),
        rows: Array(10)
    };
    private currentPos: number = 0;
    private changeLogDropDown: HTMLSelectElement = document.createElement("select");
    private changeViewDropDown: HTMLSelectElement = document.createElement("select");
    private strandLabels: string[] = [];

    constructor() {
        this.createLayout();
    }

    // helper function to set the currentPos, also updates slider and table.
    private setCurrentPos(newPos: number) {
        this.currentPos = newPos;
        this.slider.input.valueAsNumber = newPos;
        this.slider.currentPosition.setAttribute("placeholder", (newPos).toString());
        this.slider.currentPosition.value = "";
        this.updateTable();
    }

    private updateTable() {
        if(!this.visible) return;

        var start = Math.max(0, this.currentPos - this.logTable.rows.length / 2);
        start = Math.min(start, this.logEntries.length - this.logTable.rows.length);
        var row: LogRow;
        var logEntry: VertexEvent | ParityEvent;
        for (var i = 0; i < this.logTable.rows.length; i++, start++) {
            logEntry = this.logEntries[start];
            row = this.logTable.rows[i];
            if (start < this.currentPos) {
                row.row.style.background = "pink";
            } else {
                row.row.style.background = "#0f0f0f80";
            }
            if ((logEntry as ParityEvent).Index) {
                logEntry as ParityEvent;
                if (!(logEntry as ParityEvent).To) {
                    row.type.innerText = "IParity";
                    row.position.innerText = `${this.strandLabels[(logEntry as ParityEvent).Strand + 1]}(${(logEntry as ParityEvent).Index})`;
                } else {
                    row.type.innerText = "Parity";
                    row.position.innerText = (logEntry as ParityEvent).From!.toString() + " -> " + (logEntry as ParityEvent).To!.toString();
                    row.position.innerText = `${this.strandLabels[(logEntry as ParityEvent).Strand + 1]}(${(logEntry as ParityEvent).From}, ${(logEntry as ParityEvent).To})`;
                }
            } else {
                row.type.innerText = "Data";
                row.position.innerText = (logEntry as VertexEvent).Position!.toString();
            }
            row.newColor.innerHTML = '<span style="color:' + convertHexToStringColor(logEntry.NewColor) + ';">&#11044;</span> '
        }
    }

    private createLayout() {

        this.changeViewDropDown.id = "view-dropdown";
        this.addViewsToDropDown();
        this.changeViewDropDown.addEventListener("change", () => {
            var value = parseInt(this.changeViewDropDown.value)
            this.Container.dispatchEvent( new ChangeViewEvent(value, {bubbles: true}));
        });

        this.changeLogDropDown.addEventListener("change", () => {
            var value = parseInt(this.changeLogDropDown.value)
            this.Container.dispatchEvent( new LogChangedClickedEvent(value, {bubbles: true}) );
        });

        var st = this.statsTable;

        st.fileName.style.margin = "0";
        st.fileName.style.marginTop = "1em";
        st.config.style.margin = "0";
        st.table.classList.add("stats-table")

        var headerCell: HTMLTableCellElement = document.createElement("td");
        st.header.append(headerCell);
        headerCell = document.createElement("td");
        headerCell.innerText = "Data";
        st.header.append(headerCell);
        headerCell = document.createElement("td");
        headerCell.innerText = "Parity";
        st.header.append(headerCell);

        st.dlRow.type.innerHTML = '<span style="color:' + convertHexToStringColor(COLORS.GREEN) + ';">&#11044;</span> Downloaded: ';
        st.dlRow.dataCell.innerHTML = "0";
        st.dlRow.dataCell.classList.add("align-Right");
        st.dlRow.parityCell.innerHTML = "0";
        st.dlRow.parityCell.classList.add("align-Right");
        st.dlRow.row.append(st.dlRow.type, st.dlRow.dataCell, st.dlRow.parityCell);

        st.repRow.type.innerHTML = '<span style="color:' + convertHexToStringColor(COLORS.BLUE) + ';">&#11044;</span> Repaired: ';
        st.repRow.dataCell.innerHTML = "0";
        st.repRow.dataCell.classList.add("align-Right");
        st.repRow.parityCell.innerHTML = "0";
        st.repRow.parityCell.classList.add("align-Right");
        st.repRow.row.append(st.repRow.type, st.repRow.dataCell, st.repRow.parityCell);

        st.failedRow.type.innerHTML = '<span style="color:' + convertHexToStringColor(COLORS.RED) + ';">&#11044;</span> Unavailable: ';
        st.failedRow.dataCell.innerHTML = "0";
        st.failedRow.dataCell.classList.add("align-Right");
        st.failedRow.parityCell.innerHTML = "0";
        st.failedRow.parityCell.classList.add("align-Right");
        st.failedRow.row.append(st.failedRow.type, st.failedRow.dataCell, st.failedRow.parityCell);

        st.failedRepRow.type.innerHTML = '<span style="color:' + convertHexToStringColor(COLORS.YELLOW) + ';">&#11044;</span> Rep failed: ';
        st.failedRepRow.dataCell.innerHTML = "0";
        st.failedRepRow.dataCell.classList.add("align-Right");
        st.failedRepRow.parityCell.innerHTML = "0";
        st.failedRepRow.parityCell.classList.add("align-Right");
        st.failedRepRow.row.append(st.failedRepRow.type, st.failedRepRow.dataCell, st.failedRepRow.parityCell);

        st.table.append(st.header, st.dlRow.row, st.repRow.row, st.failedRow.row, st.failedRepRow.row);

        this.JumpBackButton.innerHTML = '<i class = "fa fa-fast-backward"></i>';
        this.BackButton.innerHTML = '<i class = "fa fa-step-backward"></i>';
        this.PlayButton.innerHTML = '<i class = "fa fa-step-forward"></i>';
        this.JumpForwardButton.innerHTML = '<i class = "fa fa-fast-forward"></i>';

        this.JumpBackButton.addEventListener("click", () => this.backClicked(10));
        this.BackButton.addEventListener("click", () => this.backClicked(1));
        this.PlayButton.addEventListener("click", () => this.simulate(1));
        this.JumpForwardButton.addEventListener("click", () => this.simulate(10));

        this.slider.currentPosition.id = "input-currentpos"
        this.slider.currentPosition.addEventListener("change", () => {
            var value = parseInt(this.slider.currentPosition.value);
            this.handleSliderChange(value);
        });
        this.slider.input.setAttribute("type", "range");
        this.slider.input.setAttribute("min", "0");
        this.slider.input.addEventListener("change", () => this.handleSliderChange());
        this.slider.container.append(this.slider.input, this.slider.currentPosition, this.slider.endPosition);

        var logTableRow: LogRow;
        for (var i = 0; i < this.logTable.rows.length; i++) {
            logTableRow = {
                row: document.createElement("tr"),
                type: document.createElement("td"),
                newColor: document.createElement("td"),
                position: document.createElement("td"),
            };
            // logTableRow.position.classList.add("align-Right");
            logTableRow.newColor.classList.add("align-Right");
            logTableRow.position.classList.add("align-Right");
            logTableRow.newColor.classList.add("small-Cell");
            logTableRow.position.classList.add("medium-Cell");
            logTableRow.type.classList.add("large-Cell");
            logTableRow.row.append(logTableRow.type, logTableRow.position, logTableRow.newColor);
            this.logTable.table.append(logTableRow.row);
            this.logTable.rows[i] = logTableRow;
        }

        this.logTable.table.classList.add("log-table");

        this.Container.append(this.changeLogDropDown, this.changeViewDropDown, this.statsTable.fileName, this.statsTable.config, this.statsTable.table, this.JumpBackButton, this.BackButton, this.PlayButton, this.JumpForwardButton, this.slider.container, this.logTable.table);
    }

    public CreateChangeLogBtns(nrOfLogs: number) {
        // Delete the old buttons
        while (this.changeLogDropDown.children.length > 0) {
            this.changeLogDropDown.removeChild(this.changeLogDropDown.firstChild!);
        }
        var option: HTMLOptionElement;
        for(var i=0; i < nrOfLogs; i++) {
            option = document.createElement("option");
            option.innerText = "Log #" + (i+1).toString();
            option.setAttribute("value", (i).toString());
            this.changeLogDropDown.append(option);
            
        }
    }

    // Uses the setters to set the stats in the stats-table back to 0.
    // Gets called when a user changes the current log.
    private resetStats() {
        this.NrOfDataDl = 0;
        this.NrOfDataRep = 0;
        this.NrOfDataUna = 0;
        this.NrOfDataRepFailed = 0;
        this.NrOfParityDl = 0;
        this.NrOfParityRep = 0;
        this.NrOfParityUna = 0;
        this.NrOfParityRepFailed = 0;
    }

    private handleSliderChange(optValue: number | null = null) {
        var newValue: number = optValue != null ? optValue : this.slider.input.valueAsNumber;
        if (newValue < this.currentPos) {
            this.backClicked(this.currentPos - newValue);
        }
        else if (newValue > this.currentPos) {
            this.simulate(newValue - this.currentPos);
        }
    }

    private addViewsToDropDown() {
        let opt: HTMLOptionElement;
        let i = 0;

        opt = document.createElement("option");
        opt.innerText = "2D view";
        opt.value = (++i).toString();
        this.changeViewDropDown.append(opt);

        opt = document.createElement("option");
        opt.innerText = "Cylinder view";
        opt.value = (++i).toString();
        this.changeViewDropDown.append(opt);
    }

    private backClicked(n: number) {
        if (this.currentPos > 0) {
            var oldpos = this.currentPos;
            this.currentPos = 0;
            this.simulate(Math.max(oldpos - n, 0), true);
        }
    }

    private simulate(n: number, needsReset: boolean = false) {
        if (this.currentPos > 0 || this.currentPos < this.logEntries.length - 1) {
            var vertexEvents: VertexEvent[] = [];
            var parityEvents: ParityEvent[] = [];
            var logEntry: VertexEvent | ParityEvent;
            for (var count = 0; count < n && this.currentPos + count < this.logEntries.length; count++) {
                logEntry = this.logEntries[this.currentPos + count];
                if ((logEntry as ParityEvent).Index) {
                    parityEvents.push(logEntry as ParityEvent);
                } else {
                    vertexEvents.push(logEntry as VertexEvent)
                }
            }
            this.setCurrentPos(this.currentPos + count);
            this.Container.dispatchEvent( new LogEntryEvent(vertexEvents, parityEvents, needsReset, {bubbles: true}) );
        }

    }

    public SimulateClick(n: number) {
        if(!this.visible) return;
        if (n > 0) {
            this.simulate(n);
        } else if (n < 0) {
            this.backClicked(Math.abs(n));
        }
    }

    public GetLatestEvent(): number {
        if(!this.visible) return 0;
        let latestEvent = this.logEntries[this.currentPos - 1] || this.logEntries[this.currentPos];
        return (latestEvent as VertexEvent).Position || (latestEvent as ParityEvent).From!;
    }

    public GoToStart() {
        if(!this.visible) return;
        this.backClicked(this.currentPos);
    }

    public GoToEnd() {
        if(!this.visible) return;
        this.simulate(this.logEntries.length - this.currentPos);
    }

    public Hide() {
        this.visible = false;
        this.Container.style.display = "none";
    }

    public Show() {
        this.visible = true;
        this.Container.style.display = "unset";
    }

    public FocusInput() {
        if(!this.visible) return;
        this.slider.currentPosition.focus();
    }

    // When the component get a new set of logEntries -> The user has changed the current log.
    public set LogEntries(newLogEntries: (VertexEvent | ParityEvent)[]) {
        this.logEntries = newLogEntries;
        this.slider.input.setAttribute("max", this.logEntries.length.toString());
        this.slider.endPosition.innerText = " / " + (this.logEntries.length).toString();
        this.setCurrentPos(0);
        this.resetStats();
    }

    public set StrandLabels(newLabels: string[]) {
        this.strandLabels = ["D", ... newLabels.map( (s) => {return s[0]} )];
    }

    public set Filename (newFilename: string) {
        this.statsTable.fileName.innerText = newFilename;
    }

    public set Config (newConfig: DownloadConfigLog) {
        this.statsTable.config.innerText = `(${newConfig.alpha}, ${newConfig.s}, ${newConfig.p})\t #${newConfig.dataElements}`
    }

    // DATA Download
    public set NrOfDataDl(value: number) {
        this.statsTable.dlRow.dataCell.innerText = value.toString();
    }
    
    public get NrOfDataDl(): number {
        return parseInt(this.statsTable.dlRow.dataCell.innerText)
    }
    // ----
    
    // DATA Repaired
    public set NrOfDataRep(value: number) {
        this.statsTable.repRow.dataCell.innerText = value.toString();
    }
    
    public get NrOfDataRep(): number {
        return parseInt(this.statsTable.repRow.dataCell.innerText)
    }
    // ----

    // DATA Unavailable
    public set NrOfDataUna(value: number) {
        this.statsTable.failedRow.dataCell.innerText = value.toString();
    }
    
    public get NrOfDataUna(): number {
        return parseInt(this.statsTable.failedRow.dataCell.innerText)
    }
    // -----

    // DATA RepairFailed
    public set NrOfDataRepFailed(value: number) {
        this.statsTable.failedRepRow.dataCell.innerText = value.toString();
    }
    
    public get NrOfDataRepFailed(): number {
        return parseInt(this.statsTable.failedRepRow.dataCell.innerText)
    }
    // -----

    // Parity Download
    public set NrOfParityDl(value: number) {
        this.statsTable.dlRow.parityCell.innerText = value.toString();
    }
    
    public get NrOfParityDl(): number {
        return parseInt(this.statsTable.dlRow.parityCell.innerText)
    }
    // ----
    
    // Parity Repaired
    public set NrOfParityRep(value: number) {
        this.statsTable.repRow.parityCell.innerText = value.toString();
    }
    
    public get NrOfParityRep(): number {
        return parseInt(this.statsTable.repRow.parityCell.innerText)
    }
    // ----

    // Parity Unavailable
    public set NrOfParityUna(value: number) {
        this.statsTable.failedRow.parityCell.innerText = value.toString();
    }
    
    public get NrOfParityUna(): number {
        return parseInt(this.statsTable.failedRow.parityCell.innerText)
    }
    // ----

    // Parity Rep failed
    public set NrOfParityRepFailed(value: number) {
        this.statsTable.failedRepRow.parityCell.innerText = value.toString();
    }
    
    public get NrOfParityRepFailed(): number {
        return parseInt(this.statsTable.failedRepRow.parityCell.innerText)
    }
    // ----
}