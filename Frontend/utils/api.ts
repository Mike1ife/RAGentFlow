import type { Edge, AgentNode } from "../types/graph";
import type { Prompt, TemplateName } from "../types/prompt";

const BASE = '/api';

export const fileAPI = {
    getFileList: async () => {
        try {
            const response = await fetch(`${BASE}/file/list`);
            const data = await response.json();
            return data;
        } catch (err) {
            console.error("Fail to load file list:", err);
        }
    },
    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${BASE}/file/upload`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            (error as any).status = response.status;
            throw error;
        }

        const data = await response.json();
        return data["message"];
    },
    clearFile: async () => {
        const response = await fetch(`${BASE}/file/delete`, {
            method: "DELETE"
        });
        const data = await response.json();
        return data["message"];
    },
    deleteFile: async (fileName: string) => {
        const response = await fetch(`${BASE}/file/delete/${fileName}`, {
            method: "DELETE"
        });
        const data = await response.json();
        return data["message"];
    },
    getChunks: async (fileName: string) => {
        const response = await fetch(`${BASE}/file/${fileName}/chunks`);
        const data = await response.json();
        return data;
    },
    getScoredChunks: async (fileName: string, query: string) => {
        const response = await fetch(`${BASE}/file/${fileName}/chunks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        const data = await response.json();
        return data;
    },
    getSimilarChunks: async (fileName: string, chunkIndex: number) => {
        const response = await fetch(`${BASE}/file/${fileName}/chunks/${chunkIndex}/similar`);
        const data = await response.json();
        return data;
    }
};

export const graphAPI = {
    getGraph: async () => {
        try {
            const response = await fetch(`${BASE}/graph/list`);
            const data = await response.json();
            return data;
        } catch (err) {
            console.error("Fail to load graph list:", err);
        }
    },
    resetGraph: async () => {
        try {
            const response = await fetch(`${BASE}/graph/reset`, { method: "POST" });
            const data = await response.json();
            return data;
        } catch (err) {
            console.error("Fail to reset graph:", err);
        }
    },
    addAgent: async (agent: AgentNode) => {
        const response = await fetch(`${BASE}/graph/agent`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(agent),
        });

        if (!response.ok) {
            const errorData = await response.json();
            const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            (error as any).status = response.status;
            throw error;
        }

        const data = await response.json();
        return data["message"];
    },
    deleteAgent: async (agentName: string) => {
        const response = await fetch(`${BASE}/graph/agent/${agentName}`, {
            method: "DELETE"
        });
        const data = await response.json();
        return data["message"];
    },
    editAgent: async (agentName: string, agent: AgentNode) => {
        const response = await fetch(`${BASE}/graph/agent/${agentName}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(agent),
        });

        if (!response.ok) {
            const errorData = await response.json();
            const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            (error as any).status = response.status;
            throw error;
        }

        const data = await response.json();
        return data["message"];
    },
    addEdge: async (edge: Edge) => {
        const response = await fetch(`${BASE}/graph/edge`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(edge),
        });

        if (!response.ok) {
            const errorData = await response.json();
            const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            (error as any).status = response.status;
            throw error;
        }

        const data = await response.json();
        return data["message"];
    },
    deleteEdge: async (srcNodeName: string, destNodeName: string) => {
        const response = await fetch(`${BASE}/graph/edge/${srcNodeName}/${destNodeName}`, {
            method: "DELETE"
        });
        const data = await response.json();
        return data["message"];
    },
    editEdge: async (edge: Edge) => {
        const response = await fetch(`${BASE}/graph/edge`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(edge),
        });

        if (!response.ok) {
            const errorData = await response.json();
            const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            (error as any).status = response.status;
            throw error;
        }

        const data = await response.json();
        return data["message"];
    },
    setEntry: async (nodeName: string) => {
        const response = await fetch(`${BASE}/graph/entry/${nodeName}`, {
            method: "PUT"
        });
        const data = await response.json();
        return data["message"];
    }
};

export const promptAPI = {
    getTemplate: async (templateName: TemplateName) => {
        try {
            const response = await fetch(`${BASE}/prompt/template/${templateName}`);
            const data = await response.json();
            return data;
        } catch (err) {
            console.error("Fail to load prompt template:", err);
        }
    },
    getPromptList: async () => {
        try {
            const response = await fetch(`${BASE}/prompt/list`);
            const data = await response.json();
            return data;
        } catch (err) {
            console.error("Fail to load prompt list:", err);
        }
    },
    getPromptNames: async () => {
        try {
            const response = await fetch(`${BASE}/prompt/list/name`);
            const data = await response.json();
            return data;
        } catch (err) {
            console.error("Fail to load prompt names:", err);
        }
    },
    newPrompt: async (prompt: Prompt) => {
        const response = await fetch(`${BASE}/prompt`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(prompt),
        });

        if (!response.ok) {
            const errorData = await response.json();
            const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            (error as any).status = response.status;
            throw error;
        }

        const data = await response.json();
        return data["message"];
    },
    updatePrompt: async (prompt: Prompt) => {
        const response = await fetch(`${BASE}/prompt`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(prompt),
        });

        if (!response.ok) {
            const errorData = await response.json();
            const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            (error as any).status = response.status;
            throw error;
        }

        const data = await response.json();
        return data["message"];
    },
    deletePrompt: async (promptName: string) => {
        const response = await fetch(`${BASE}/prompt/${promptName}`, {
            method: "DELETE"
        });
        const data = await response.json();
        return data["message"];
    }
};

export const simulationAPI = {
    getValidation: async () => {
        const response = await fetch(`${BASE}/simulation/validate`);
        const data = await response.json();
        return data;
    },
    runSimulation: async (query: string) => {
        const response = await fetch(`${BASE}/simulation/run`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }),
        });
        const data = await response.json();
        return data["message"];
    },
    getResult: async () => {
        const response = await fetch(`${BASE}/simulation/result`);

        if (!response.ok) {
            const errorData = await response.json();
            const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            (error as any).status = response.status;
            throw error;
        }

        const data = await response.json();
        return data;
    }
};

export default {
    file: fileAPI,
    graph: graphAPI,
    prompt: promptAPI,
    simulation: simulationAPI
};