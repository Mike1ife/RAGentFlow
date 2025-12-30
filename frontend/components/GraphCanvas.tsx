import { useEffect, useRef, useState } from "react";
import { computeGraphLayout } from "../utils/computeGraphLayout";
import type { Edge, Graph, LayoutedEdge, LayoutedNode, AgentNode } from "../types/graph";
import { UncontrolledReactSVGPanZoom, ReactSVGPanZoom } from 'react-svg-pan-zoom';
import AutoSizer from "react-virtualized-auto-sizer";

export default function GraphCanvas({ graph, selectedAgent, selectedEdge, onClickAgent, onClickEdge }: {
    graph: Graph,
    selectedAgent: AgentNode | null,
    selectedEdge: Edge | null,
    onClickAgent: Function,
    onClickEdge: Function;
}) {
    const nodeRadius = 55;
    const [nodes, setNodes] = useState<LayoutedNode[]>([]);
    const [edges, setEdges] = useState<LayoutedEdge[]>([]);
    const [bounds, setBounds] = useState<{
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    } | null>(null);

    const viewer = useRef<ReactSVGPanZoom>(null);

    useEffect(() => {
        if (!bounds) return;

        requestAnimationFrame(() => {
            viewer.current?.fitToViewer();
        });
    }, [bounds]);

    useEffect(() => {
        if (!graph) return;

        computeGraphLayout(graph, nodeRadius).then(({ nodes, edges }) => {
            setNodes(nodes);
            setEdges(edges);

            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            nodes.forEach(n => {
                minX = Math.min(minX, n.x - 2 * nodeRadius);
                maxX = Math.max(maxX, n.x + 2 * nodeRadius);
                minY = Math.min(minY, n.y - 2 * nodeRadius);
                maxY = Math.max(maxY, n.y + 2 * nodeRadius);
            });

            edges.forEach(e => {
                e.points.forEach(p => {
                    minX = Math.min(minX, p.x);
                    maxX = Math.max(maxX, p.x);
                    minY = Math.min(minY, p.y);
                    maxY = Math.max(maxY, p.y);
                });
            });

            if (minX != Infinity && minY != Infinity && maxX != -Infinity && maxY != -Infinity) {
                setBounds({ minX, minY, maxX, maxY });
            }
        });
    }, [graph]);

    const pointsToPath = (points: { x: number; y: number; }[], shortenLast = 0) => {
        if (points.length === 0) return "";

        let path = `M ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length; i++) {
            let x = points[i].x;
            let y = points[i].y;

            // If this is the last segment and we want to shorten it
            if (i === points.length - 1 && shortenLast > 0) {
                const prev = points[i - 1];
                const dx = x - prev.x;
                const dy = y - prev.y;
                const length = Math.sqrt(dx * dx + dy * dy);

                if (length > 0) {
                    const scale = (length - shortenLast) / length;
                    x = prev.x + dx * scale;
                    y = prev.y + dy * scale;
                }
            }

            path += ` L ${x} ${y}`;
        }

        return path;
    };

    const getCanvasViewPort = (width: number, height: number) => {
        if (!bounds) {
            return `0 0 ${width} ${height}`;
        }

        const contentWidth = bounds.maxX - bounds.minX;
        const contentHeight = bounds.maxY - bounds.minY;
        const contentRatio = contentWidth / contentHeight;
        const containerRatio = width / height;

        let viewWidth = contentWidth;
        let viewHeight = contentHeight;
        let offsetX = bounds.minX;
        let offsetY = bounds.minY;

        if (contentRatio < containerRatio) {
            // Expand width to grow contentRatio to match container ratio
            // width = height * ratio
            // Match container width
            viewWidth = contentHeight * containerRatio;
            // extra width = viewWidth - contentWidth
            // shift camera-X by half of extra to center content
            offsetX -= (viewWidth - contentWidth) / 2;
        } else {
            // Expand height to shrink contentRatio to match container ratio
            // height = width / ratio
            // Match container height
            viewHeight = contentWidth / containerRatio;
            // extra height = viewHeight - contentHeight
            // shift camara-Y by half of extra to center content
            offsetY -= (viewHeight - contentHeight) / 2;
        }

        if (viewWidth < width) {
            return `0 0 ${width} ${height}`;
        }

        return `${offsetX} ${offsetY} ${viewWidth} ${viewHeight}`;
    };


    return (
        <AutoSizer>
            {({ width, height }) => (
                <UncontrolledReactSVGPanZoom
                    ref={viewer}
                    width={width}
                    height={height}
                    detectAutoPan={false}
                >
                    <svg width="100%" height="100%" viewBox={getCanvasViewPort(width, height)}>
                        <defs>
                            <marker
                                id="arrow"
                                viewBox="0 0 10 10" // coordinate system of marker
                                refX="0" // x of marker to anchor to the line end
                                refY="5" // y of marker to anchor to the line end
                                markerWidth="8"
                                markerHeight="8"
                                orient="auto" // rotate arrow with line
                                markerUnits="userSpaceOnUse" // fixed arrow size (not scale with line)
                            >
                                {/* Shape */}
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
                            </marker>
                        </defs>

                        {edges.map(edge => {
                            const d = pointsToPath(edge.points, 8);

                            return (
                                <g key={`${edge.srcNodeName}-${edge.destNodeName}`}
                                    onClick={() => onClickEdge(edge.srcNodeName, edge.destNodeName)}>
                                    {/* Invisible hit target */}
                                    <path
                                        d={d}
                                        className="graph-edge-hit"
                                    />

                                    {/* Visible edge */}
                                    <path
                                        d={d}
                                        className={`graph-edge 
                                                ${selectedEdge?.srcNode === edge.srcNodeName && selectedEdge.destNode === edge.destNodeName ? "selected-edge" : ""}`}
                                    />
                                </g>
                            );
                        })}

                        {nodes.map(node => (
                            <g key={`${node.name}`}
                                className={`graph-node-circle ${selectedAgent?.name === node.name ? "selected-graph-node" : ""}`}
                                onClick={() => onClickAgent(node.name)}>
                                <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={nodeRadius}
                                    fill={node.color}
                                />
                                <text
                                    className="graph-node-text"
                                    x={node.x}
                                    y={node.y}
                                >
                                    {node.name}
                                </text>
                            </g>
                        ))}
                    </svg>
                </UncontrolledReactSVGPanZoom>
            )}
        </AutoSizer>
    );
}