import { useState } from "react";
import type { Chunk } from "../../types/file";
import ModalHeader from "./ModalHeader";

const getScaledValue = (value: number, mean: number, std: number) => {
    const z = (value - mean) / std;
    const scaled = Math.tanh(z / 2);
    return scaled;
};

const getHeatmapColor = (scaled: number) => {
    const intensity = Math.abs(scaled); // [0, 1]
    // rbg = (r, g, b)
    // new = 255 - (255 - r/g/b) * intensity
    if (scaled < 0) {
        const r = Math.floor(255 - (255 - 128) * intensity);
        const g = Math.floor(255 * (1 - intensity));
        const b = Math.floor(255 - (255 - 128) * intensity);
        return `rgb(${r}, ${g}, ${b})`;
    } else if (scaled > 0) {
        const r = 255;
        const g = Math.floor(255 - (255 - 165) * intensity);
        const b = Math.floor(255 * (1 - intensity));
        return `rgb(${r}, ${g}, ${b})`;
    } else {
        return 'rgb(255, 255, 255)';
    }
};

const renderHeatMap = (embedding: number[]) => {
    const [hoveredCell, setHoveredCell] = useState<number | null>(null);

    const mean = embedding.reduce((a, b) => a + b, 0) / embedding.length;
    const std = Math.sqrt(
        embedding.reduce((s, v) => s + (v - mean) ** 2, 0) / embedding.length
    );

    return (
        <div className="embedding-container">
            <div className="heatmap-container">
                <div className="heatmap-grid">
                    {embedding.map((value: number, idx: number) => (
                        <div key={idx} className="heatmap-cell"
                            style={{
                                backgroundColor: getHeatmapColor(getScaledValue(value, mean, std))
                            }}
                            onMouseEnter={() => setHoveredCell(idx)}
                            onMouseLeave={() => setHoveredCell(null)}
                        />
                    ))}
                </div>

                <legend className="heatmap-legend">
                    <span>-1.0</span>
                    <div className="gradient-bar" />
                    <span>+1.0</span>
                </legend>

                {hoveredCell !== null && (
                    <div className="hover-tooltip">
                        Dimension {hoveredCell + 1}<br />
                        Raw: {embedding[hoveredCell].toFixed(4)}<br />
                        Scaled: {getScaledValue(embedding[hoveredCell], mean, std).toFixed(2)}
                    </div>
                )}
            </div>
        </div >
    );
};

export default function ChunkDetailModal({ chunk, similarChunks, onCloseChunkDetail }: { chunk: Chunk, similarChunks: Chunk[], onCloseChunkDetail: Function; }) {
    return (
        <div className="modal-overlay">
            <section className="chunk-detail-modal-container">
                <ModalHeader title={`Chunk Details - Chunk #${chunk.index + 1}`} onClose={onCloseChunkDetail} />

                <div className="chunk-detail-modal-body">
                    <div className="chunk-detail-modal-content">
                        <h4>Full Content</h4>
                        <div>{chunk.content}</div>
                    </div>

                    <div className="chunk-detail-modal-embedding">
                        <h4>Embedding Visualization:</h4>
                        {renderHeatMap(chunk.embedding)}
                    </div>

                    <div className="chunk-detail-modal-similar">
                        <h4>Similar Chunks</h4>
                        <div>
                            {
                                similarChunks.map((similarChunk: Chunk) => (
                                    <span key={similarChunk.index}>●​ Chunk #{similarChunk.index + 1} ({similarChunk.score} similarity)</span>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}