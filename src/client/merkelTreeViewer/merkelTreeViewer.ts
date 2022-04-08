import { DataContainer } from "../SharedKernel/dataContainer";
import { Parity, Vertex } from "../SharedKernel/interfaces";
import { convertHexToStringColor } from "../SharedKernel/utils";
import { InfoGraphic, MouseOverElement, Tile } from "./interfaces/interfaces";

const SVGURL = "http://www.w3.org/2000/svg";
export class MerkelTreeViewer extends DataContainer {

    public Container: HTMLDivElement = document.createElement("div");
    private infoGraphic: InfoGraphic = {
        Container: document.createElement("div"),
        Text: document.createElement("p"),
        BreadCrumbs: document.createElement("p"),
        BreadCrumbsIndex: [],
        ViewButtons: [],
        ViewButtonsContainer: document.createElement("div"),
    }
    private svgElement: SVGElement = document.createElementNS(SVGURL, "svg");
    private mouseOverEle: MouseOverElement = {
        Container: this.Container.appendChild(document.createElement("div")),
        List: document.createElement("ul")
    };
    private padding = 20;
    private borderSize = 4;
    private tiles: Tile[] = Array(140);
    private currentRootNode: number = 0;
    private currentView: number = 0;
    private visible: boolean = false;
    public StrandLabels: string[] = [];

    constructor() {
        super();
        this.createLayout();
        
    }

    private createLayout() {

        this.Container.id = "tree-container";
        this.svgElement.id = "original-merkel-tree";
        this.createTileElements();

        this.mouseOverEle.Container.style.position = "absolute";
        this.mouseOverEle.Container.style.backgroundColor = "white";
        this.mouseOverEle.Container.style.border = "1px solid black"
        this.mouseOverEle.Container.setAttribute("display", "none")
        this.mouseOverEle.Container.style.pointerEvents = "none";
        this.mouseOverEle.Container.append(this.mouseOverEle.List);

        this.Container.append(this.infoGraphic.Container, this.svgElement);

    }

    public HandleUpdatedDate() {
        this.currentView = 0;
        this.currentRootNode = this.nrOfVertices;
        this.infoGraphic.BreadCrumbsIndex = [this.currentRootNode]
        this.CreateInfoGraphic();
        this.updateInfoGraphic();
        this.updateDynamicAttributes();
        this.updateTreeStruct();
    }

    public onWindowResize() {
        this.updateDynamicAttributes();
        this.updateTreeStruct();
    }

    public UpdateVertex(vertexIndex :number[] ) {
        if (this.currentView > 0) {
            return
        }
        this.updateTreeStruct();
    }

    public UpdateParity(vertexIndex: number, strand: number) {
        if (this.currentView != strand) {
            return
        }
        this.updateTreeStruct();
    }

    public Update() {
        this.updateTreeStruct();
    }

    private updateDynamicAttributes() {
        this.svgElement.setAttribute("height", (window.innerHeight * 0.2).toString());
        this.svgElement.setAttribute("width", (window.innerWidth).toString());

        this.infoGraphic.Container.setAttribute("height", (window.innerHeight * 0.2).toString());
        this.infoGraphic.Container.setAttribute("width", (window.innerWidth).toString());
    }
    
    private createTileElements() {
        var tile: Tile

        for (let i = 0; i < this.tiles.length; i++) {
            tile = {
                Container: document.createElementNS(SVGURL, "svg"),
                Rect: document.createElementNS(SVGURL, "rect"),
                Text: document.createElementNS(SVGURL, "text")
            };

            tile.Rect.setAttribute("stroke-width", (this.borderSize).toString());
            tile.Rect.setAttribute("stroke", "black")

            tile.Text.setAttribute("text-anchor", "middle");
            tile.Text.setAttribute("dominant-baseline", "middle");

            tile.Container.append(tile.Rect, tile.Text);
            tile.Container.addEventListener("click", () => { this.tileOnClickHandler(i) });
            tile.Container.addEventListener("mouseenter", () => { this.tileMouseEnterHandler(i) })
            tile.Container.addEventListener("mouseleave", () => this.tileMouseLeaveHandler(i));

            this.svgElement.append(tile.Container);
            this.tiles[i] = tile
        }
    }

    private CreateInfoGraphic() {

        this.infoGraphic.Container.style.width = "100%"
        this.infoGraphic.Container.style.height = this.padding.toString() + "px";
        this.infoGraphic.Container.style.position = "absolute";

        this.infoGraphic.BreadCrumbs.style.margin = "0";
        this.infoGraphic.BreadCrumbs.style.float = "left";

        this.infoGraphic.Text.style.margin = "0";
        this.infoGraphic.Text.style.textAlign = "center";

        /* Delete old view-buttons */
        while (this.infoGraphic.ViewButtonsContainer.children.length > 0) {
            this.infoGraphic.ViewButtonsContainer.removeChild(this.infoGraphic.ViewButtonsContainer.firstChild!);
        }
        this.infoGraphic.ViewButtons = [];

        var btn: HTMLButtonElement;

        for (let a = 0; a <= this.StrandLabels.length; a++) {
            btn = document.createElement("button");
            btn.innerText = a == 0 ? "Data" : this.StrandLabels[a-1];
            btn.addEventListener("click", () => this.viewBtnClickedHandler(a));
            this.infoGraphic.ViewButtonsContainer.append(btn);
        }
        this.infoGraphic.ViewButtonsContainer.style.position = "absolute";
        this.infoGraphic.ViewButtonsContainer.style.right = "0";
        this.infoGraphic.ViewButtonsContainer.style.top = "0";

        this.infoGraphic.Container.append(this.infoGraphic.BreadCrumbs, this.infoGraphic.Text, this.infoGraphic.ViewButtonsContainer);
    }

    private updateInfoGraphic() {
        var breadCrumb: HTMLAnchorElement;
        var node: Vertex | Parity;
        var currentRootNode = this.getCurrentRootNode();

        while (this.infoGraphic.BreadCrumbs.children.length > 0) { this.infoGraphic.BreadCrumbs.removeChild(this.infoGraphic.BreadCrumbs.lastChild!) }
        for (let rootNodeIndex of this.infoGraphic.BreadCrumbsIndex) {
            node = this.getRootNode(rootNodeIndex);
            breadCrumb = document.createElement("a");
            breadCrumb.href = "#";
            breadCrumb.addEventListener("mousedown", () => this.breadCrumbOnClickHandler(rootNodeIndex));
            breadCrumb.innerHTML = `>${node.Index}`
            this.infoGraphic.BreadCrumbs.append(breadCrumb);
        }
        var currentView = this.currentView == 0 ? "Data" : this.StrandLabels[this.currentView -1];
        this.infoGraphic.Text.innerHTML = `Current view: ${currentView}, Current node: ${currentRootNode.Index}, Depth: ${currentRootNode.Depth}, Number of children: ${currentRootNode.Children.length}`
    }

    private updateTreeStruct() {
        var vertex: Vertex | Parity;
        var tile: Tile;
        var nrOfChildren, nrOfRows, nrOfColumns, tileWidth, tileHeight, tileCounter, row, col: number;
        var currentRootNode : Vertex | Parity = this.getCurrentRootNode();
        
        nrOfChildren = currentRootNode.Children.length;
        // Check if nrOfChildren is a prime and increase nrOfChildren by 1 if prime
        if (this.PrimeCheck(nrOfChildren) && nrOfChildren > 5) {
            nrOfChildren++
            //nrOfRows = Math.floor((2 / 3) * Math.sqrt(nrOfChildren)) || 1; 
            //nrOfColumns = Math.ceil(nrOfChildren / nrOfRows);
        }
        // If not prime know the product of two numbers will give nrOfChildren
        let combo: [number, number];
        let listCombinations = []
        listCombinations.push([1, nrOfChildren]);
        for (let i = 2; i < nrOfChildren; i++) {                            // https://www.brilliant.org/bartek_stasiak;
            if (Number.isInteger(nrOfChildren / i)) {
                combo = [i, nrOfChildren/i]
                if (listCombinations[listCombinations.length - 1][1] == i) {
                    break
                }
                listCombinations.push(combo)
            }
        }
        nrOfRows = listCombinations[listCombinations.length - 1][0]
        nrOfColumns = listCombinations[listCombinations.length - 1][1]

        tileWidth = Math.ceil((this.svgElement.clientWidth - this.padding * 2) / nrOfColumns);
        tileHeight = Math.ceil((this.svgElement.clientHeight - this.padding * 2) / nrOfRows);


        tileCounter = 0;
        row = 0;
        col = 0;

        for (let childIndex of currentRootNode.Children) {
            vertex = this.getRootNode(childIndex);
            tile = this.tiles[tileCounter];

            if (vertex.DamagedChildren > 0 && vertex.Depth > 1) {
                tile.Rect.setAttribute("stroke", "red");
            } else {
                tile.Rect.setAttribute("stroke", "none");
            }

            tile.Container.setAttribute("x", (col * tileWidth + this.padding).toString());
            tile.Container.setAttribute("y", (row * (tileHeight) + this.padding).toString());
            tile.Container.setAttribute("width", (tileWidth).toString());
            tile.Container.setAttribute("height", (tileHeight).toString());
            tile.Container.setAttribute("display", "unset");

            tile.Rect.setAttribute("width", (tileWidth).toString());
            tile.Rect.setAttribute("height", (tileHeight).toString());
            tile.Rect.setAttribute("fill", convertHexToStringColor(vertex.Color));

            tile.Text.setAttribute("x", (tileWidth / 2).toString());
            tile.Text.setAttribute("y", (tileHeight / 2 + 2).toString());
            tile.Text.innerHTML = vertex.Index.toString();

            col = (col + 1) % nrOfColumns
            if (col == 0) row++

            tileCounter++;
        }
        // Hide rest of the tiles.
        for (; tileCounter < this.tiles.length; tileCounter++) {
            this.tiles[tileCounter].Container.setAttribute("display", "none");
        }

        this.updateInfoGraphic();
    }

    private PrimeCheck(n: number) {
        if (n < 4) {
            return true;
        }
        for (let x = 2; x < n; x++) {
            if (n % x == 0) {
                return false;
            }
        }
        return true;
    }

    private tileOnClickHandler(tileIndex: number) {
        var currentRootNode = this.getCurrentRootNode();
        let childIndex = currentRootNode.Children[tileIndex]
        currentRootNode = this.getRootNode(childIndex);
        if (currentRootNode.Children.length > 0) {
            this.currentRootNode = childIndex;
            this.infoGraphic.BreadCrumbsIndex.push(this.currentRootNode);
            // Hide the the mouseOverElement
            this.mouseOverEle.Container.style.display = "none";
            this.updateTreeStruct();
        }
    }

    private tileMouseEnterHandler(tileIndex: number) {
        if(this.currentView != 0) return;
        let rootNode = this.getCurrentRootNode();
        if(rootNode.Depth <= 2) return;
        let tile = this.tiles[tileIndex];
        tile.Text.innerHTML = "( " + (rootNode.Children[tileIndex]).toString() + " )";
    }

    private tileMouseLeaveHandler(tileIndex: number) {
        if(this.currentView != 0) return;
        let rootNode = this.getCurrentRootNode();
        let childeNode = this.getRootNode(rootNode.Children[tileIndex]);
        let tile = this.tiles[tileIndex];
        tile.Text.innerHTML = (childeNode.Index).toString();
    }

    private breadCrumbOnClickHandler(rootNodeIndex: number) {
        this.currentRootNode = rootNodeIndex;
        while (this.infoGraphic.BreadCrumbsIndex[this.infoGraphic.BreadCrumbsIndex.length - 1] != rootNodeIndex) {
            this.infoGraphic.BreadCrumbsIndex.pop();
        }
        this.updateTreeStruct();
    }

    private viewBtnClickedHandler(view: number) {
        // Sets this.currentRootNode to root node
        // Root node will always be the one with the largest index.
        if (view == 0) {
            this.currentRootNode = this.vertices.size;
        } else {
            this.currentRootNode = this.parities[view - 1].size;
        }
        this.infoGraphic.BreadCrumbsIndex = [this.currentRootNode];
        this.currentView = view;
        this.updateTreeStruct();
    }

    private getCurrentRootNode() : Vertex | Parity {
        if (this.currentView == 0) {
            return this.vertices.get(this.currentRootNode)!;
        }
        return this.parities[this.currentView -1].get(this.currentRootNode)!
    }

    private getRootNode(index: number) : Vertex | Parity {
        if (this.currentView == 0) {
            return this.vertices.get(index)!;
        }
        return this.parities[this.currentView -1].get(index)!
    }

    private toggleVisible() {
        if (this.visible) {
            this.Container.style.display = "none";
        } else {
            this.Container.style.display = "block";
        }
        this.visible = !this.visible;
    }

    public Hide() {
        this.visible = true;
        this.toggleVisible();
    }

    public Show() {
        this.visible = false;
        this.toggleVisible();
    }

}