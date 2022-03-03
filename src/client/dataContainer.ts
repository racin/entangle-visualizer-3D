import { Parity, Vertex } from "./interfaces";

export class DataContainer {
    alpha: number = 0;
    s: number = 0;
    p: number = 0;
    nrOfVertices: number = 0;
    vertices: Map<number, Vertex> = new Map();
    parities: Map<number, Parity>[] = [];
    AdrToStrand: Map<string, number> = new Map();
    maxDepth: number = 0;

    constructor() {}

    UpdateData(alpha: number, s: number, p: number, vertices: Map<number, Vertex>, parities: Map<number, Parity>[], adrToStrand: Map<string, number>) {
        this.alpha = alpha;
        this.s = s;
        this.p = p;
        this.vertices = vertices;
        this.parities = parities;
        this.nrOfVertices = this.vertices.size;
        this.maxDepth = vertices.get(this.nrOfVertices)!.Depth; // Last node in the array is always the root node.
        this.AdrToStrand = adrToStrand;
    }
}