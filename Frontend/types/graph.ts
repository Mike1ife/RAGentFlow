export interface ClassificationConfig {
    options: string[];
}

export interface BooleanConfig {
    question: string;
}

export interface NumericConfig {
    instruction: string;
}

export interface AgentNode {
    name: string;
    agentType: "classifier" | "gatekeeper" | "scorer" | "responder";

    // For decision-making agents (classifier, gatekeeper, scorer)
    outputField?: string;
    decisionConfig?: ClassificationConfig | BooleanConfig | NumericConfig;

    // For response agents
    promptName?: string;
}

export interface LayoutedNode {
    name: string;
    x: number;
    y: number;
    color: string;
};

export interface LayoutedEdge {
    srcNodeName: string;
    destNodeName: string;
    points: { x: number; y: number; }[];
}

export type GraphOperator = "eq" | "gt" | "lt" | "gte" | "lte";
export type MathOperator = "=" | ">" | "<" | "≥" | "≤";

export const MathOperatorMap: Record<MathOperator, GraphOperator> = {
    "=": "eq",
    ">": "gt",
    "<": "lt",
    "≥": "gte",
    "≤": "lte"
};
export const MathDisplayMap: Record<GraphOperator, MathOperator> = {
    "eq": "=",
    "gt": ">",
    "lt": "<",
    "gte": "≥",
    "lte": "≤"
};

export interface Condition {
    operator: GraphOperator;
    value: string | number | boolean;
}

export interface Edge {
    srcNode: string;
    destNode: string;
    condition: Condition;
}

export interface Graph {
    entryNode: string;
    nodes: Record<string, AgentNode>;
    edges: Record<string, Edge[]>;
}