import "./styles/Overview.css";
import { useEffect, useState } from "react";
import api from "../utils/api";
import type { ChunkFile } from "../types/file";
import type { AgentNode, Graph } from "../types/graph";
import { renderPDFIcon } from "./FileStorage";
import AgentIcon from "./AgentIcon";

export default function Overview() {
    const [fileList, setFileList] = useState<ChunkFile[]>([]);
    const [graph, setGraph] = useState<Graph>({
        entryNode: "",
        nodes: {},
        edges: {},
    });

    const loadFileList = async () => {
        const data = await api.file.getFileList();
        setFileList(data);
    };

    const loadGraph = async () => {
        const data = await api.graph.getGraph();
        setGraph(data);
    };

    useEffect(() => {
        loadFileList();
        loadGraph();
    }, []);

    const renderModels = () => {
        return (
            <section className="model-container">
                <h3>Model Configuration</h3>
                <div className="card-container">
                    <div className="card">
                        <h4>Language Model</h4>
                        <p className="model-name">LongCat-Flash-Chat</p>
                        <p className="model-description">OpenAI-compatible chat model for text generation</p>
                    </div>
                    <div className="card">
                        <h4>Embedding Model</h4>
                        <p className="model-name">all-MiniLM-L6-v2</p>
                        <p className="model-description">HuggingFace embeddings (384 dimensions)</p>
                    </div>
                    <div className="card">
                        <h4>Reranker</h4>
                        <p className="model-name">ms-marco-MiniLM-L-6-v2</p>
                        <p className="model-description">Cross-encoder for relevance scoring</p>
                    </div>
                    <div className="card">
                        <h4>Tokenizer</h4>
                        <p className="model-name">all-MiniLM-L6-v2</p>
                        <p className="model-description">Text splitting and tokenization</p>
                    </div>
                </div>
            </section>
        );
    };

    const renderFiles = () => {
        return (
            <section className="list-container">
                <h4>File List</h4>
                {
                    fileList.length == 0 ? (
                        <span className="list-empty">No files yet</span>
                    ) : (
                        <div className="file-list">
                            {fileList.map((file: ChunkFile) =>
                                <div key={file.name} className="file-row">
                                    {renderPDFIcon()}
                                    <div>
                                        <p className="filename">{file.name}</p>
                                        <p className="timestamp">Upload at {file.createdAt}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }
            </section>
        );
    };

    const renderAgents = () => {
        const agents = Object.values(graph.nodes) as AgentNode[];

        return (
            <section className="list-container">
                <h4>Agent List</h4>
                {
                    (agents.length === 0) ? (
                        <span className="list-empty">No agents yet</span>
                    ) : (
                        <div className="agent-list">
                            {
                                agents.map((agent: AgentNode) =>
                                    <div key={agent.name} className="agent-row">
                                        <AgentIcon agentType={agent.agentType} size={50} />
                                        <div className="agent-info-container">
                                            <div className="agent-info-main">
                                                <span className="agent-name">{agent.name}</span>
                                                {
                                                    agent.name === graph.entryNode && (
                                                        <span className="agent-card entry">Entry</span>
                                                    )
                                                }
                                            </div>
                                            <div className="agent-info-detail">
                                                <span className={`agent-card ${agent.agentType}`}>{agent.agentType}</span>
                                                {agent.outputField && <span className="agent-card output">{agent.outputField}</span>}
                                                {agent.promptName && <span className="agent-card prompt">{agent.promptName}</span>}
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    )
                }
            </section>
        );
    };

    return (
        <main>
            {renderModels()}
            <div className="body-container">
                {renderFiles()}
                {renderAgents()}
            </div>
        </main>
    );
}