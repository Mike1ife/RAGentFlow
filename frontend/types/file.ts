export interface ChunkFile {
    name: string;
    createdAt: string;
}

export interface Chunk {
    index: number;
    content: string;
    embedding: number[];
    score: number | null;
}
