import ELK from "elkjs/lib/elk.bundled.js";
import type { Graph, LayoutedEdge, LayoutedNode } from "../types/graph";

const elk = new ELK();

export async function computeGraphLayout(graph: Graph, nodeRadius: number) {
    const nodeSize = nodeRadius * 2;

    const elkGraph = {
        id: "root",
        layoutOptions: {
            "elk.algorithm": "layered",
            "elk.direction": "RIGHT",
            "elk.layered.edgeRouting": "ORTHOGONAL",
            "elk.layered.spacing.layerLayer": "160", // Distance between layers (columns)
            "elk.layered.spacing.nodeNodeBetweenLayers": "100", // Horizontal spacing between nodes within the same layer
            "elk.spacing.nodeNode": "90", // General minimum distance between any two nodes
            "elk.layered.wrapping.strategy": "SINGLE_EDGE",
            "elk.layered.mergeEdges": "false", // Whether ELK is allowed to merge parallel edges into a shared trunk
        },
        children: Object.values(graph.nodes).map(node => ({
            id: node.name,
            width: nodeSize,
            height: nodeSize,
        })),
        edges: Object.values(graph.edges) // list of Edge[]
            .flat() // list of Edge
            .map((edge, i) => ({
                id: `elk_edge_${i}`,
                sources: [edge.srcNode],
                targets: [edge.destNode],
            })),
    };

    const layout = await elk.layout(elkGraph);
    const colorMap: Record<string, string> = {
        "responder": "royalblue",
        "classifier": "blueviolet",
        "gatekeeper": "darkolivegreen",
        "scorer": "firebrick"
    };

    const nodes: LayoutedNode[] = layout.children!.map((n: any) => ({
        name: n.id,
        x: n.x! + nodeRadius, // n.x! asserts that n.x is not null or undefined
        y: n.y! + nodeRadius,
        color: graph.nodes[n.id].name === graph.entryNode ? "#13b81b" : colorMap[graph.nodes[n.id].agentType],
    }));

    const edges: LayoutedEdge[] = layout.edges!.map((e: any) => {
        const section = e.sections[0];
        const points = [
            section.startPoint,
            ...(section.bendPoints ?? []),
            section.endPoint,
        ];
        return {
            srcNodeName: e.sources[0],
            destNodeName: e.targets[0],
            points: points,
        };
    });

    return { nodes, edges };
}