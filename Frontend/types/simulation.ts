import type { Graph } from "./graph";

export interface Requirement {
    name: string,
    passed: boolean,
    message: string;
}

export interface DuplicateCondition {
    srcNode: string,
    destNodes: string[];
    condition: string;
}

export interface MissingRoute {
    srcNode: string,
    missingValue: string;
}

export interface Validation {
    canProceed: boolean,
    requirements: Requirement[],
    unreachableAgents: string[],
    duplicateConditions: DuplicateCondition[],
    missingRoutes: MissingRoute[];
}

export interface RespondTrace {
    agent: string;
    agentType: "responder";
    prompt: string;
    output: string;
}

export interface RouteTrace {
    agent: string;
    agentType: "classifier" | "gatekeeper" | "scorer";
    outputField: string;
    outputValue: string | number | boolean;
    reason: string;
    nextNode: string;
    matchedCondition: string;
}

export interface RetrievedChunk {
    fileName: string;
    chunkIndex: number;
    content: string;
    distance: number;
    score: number;
}

export interface Result {
    query: string;
    chunks: RetrievedChunk[];
    context: string;
    traces: (RespondTrace | RouteTrace)[];
    graph: Graph;
}