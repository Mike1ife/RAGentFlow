import "./styles/GraphManager.css";
import { useEffect, useState } from "react";
import { type Edge, type Graph, type AgentNode, MathDisplayMap } from "../types/graph";
import api from "../utils/api";
import EdgeFormModal from "./modals/EdgeFormModal";
import AgentFormModal from "./modals/AgentFormModal";
import AgentIcon from "./items/AgentIcon";
import GraphCanvas from "./GraphCanvas";
import WarningModal from "./modals/WarningModal";

export default function GraphManager() {
    const [graph, setGraph] = useState<Graph>({
        entryNode: "",
        nodes: {},
        edges: {},
    });
    const [showAddEdge, setShowAddEdge] = useState<boolean>(false);
    const [showAddAgent, setShowAddAgent] = useState<boolean>(false);
    const [showResetGraph, setShowResetGraph] = useState<boolean>(false);
    const [showAgentPanel, setShowAgentPanel] = useState<boolean>(false);
    const [showEditAgent, setShowEditAgent] = useState<boolean>(false);
    const [showDeleteAgent, setShowDeleteAgent] = useState<boolean>(false);
    const [showEdgePanel, setShowEdgePanel] = useState<boolean>(false);
    const [showEditEdge, setShowEditEdge] = useState<boolean>(false);
    const [showDeleteEdge, setShowDeleteEdge] = useState<boolean>(false);
    const [selectedAgent, setSelectedAgent] = useState<AgentNode | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

    useEffect(() => {
        loadGraph();
    }, []);

    const loadGraph = async () => {
        const data = await api.graph.getGraph();
        setGraph(data);
    };

    const onSetEntry = async (agentName: string) => {
        const data = await api.graph.setEntry(agentName);
        console.log(data);
        loadGraph();
    };

    const onCloseEdgeForm = () => {
        setShowAddEdge(false);
        setShowEditEdge(false);
    };

    const onCloseAgentForm = () => {
        setShowAddAgent(false);
        setShowEditAgent(false);
    };

    const onCloseResetGraph = () => {
        setShowResetGraph(false);
    };

    const handleReset = async () => {
        const response = await api.graph.resetGraph();
        console.log(response);
        deselectAgent();
        deselectEdge();
        loadGraph();
        onCloseResetGraph();
    };

    const onSubmitAgentForm = (agent: AgentNode) => {
        loadGraph();

        deselectEdge();
        setSelectedAgent(agent);
        setShowAgentPanel(true);
    };

    const onCloseDeleteAgent = () => {
        setShowDeleteAgent(false);
    };

    const handleDeleteAgent = async () => {
        const response = await api.graph.deleteAgent(selectedAgent!.name);
        console.log(response);
        deselectAgent();
        loadGraph();
        onCloseDeleteAgent();
    };

    const onSubmitEdgeForm = (edge: Edge) => {
        loadGraph();

        deselectAgent();
        setSelectedEdge(edge);
        setShowEdgePanel(true);
    };

    const onCloseDeleteEdge = () => {
        setShowDeleteEdge(false);
    };

    const handleDeleteEdge = async () => {
        const response = await api.graph.deleteEdge(selectedEdge!.srcNode, selectedEdge!.destNode);
        console.log(response);
        deselectEdge();
        loadGraph();
        onCloseDeleteEdge();
    };

    const deselectAgent = () => {
        setShowAgentPanel(false);
        setSelectedAgent(null);
    };

    const deselectEdge = () => {
        setShowEdgePanel(false);
        setSelectedEdge(null);
    };

    const onClickAgent = (agentName: string) => {
        deselectEdge();

        if (agentName === selectedAgent?.name) {
            deselectAgent();
        } else {
            deselectAgent();
            setSelectedAgent(graph.nodes[agentName]);
            setShowAgentPanel(true);
        }
    };

    const onClickEdge = (srcNodeName: string, destNodeName: string) => {
        deselectAgent();

        if (srcNodeName === selectedEdge?.srcNode && destNodeName === selectedEdge.destNode) {
            deselectEdge();
        } else {
            deselectEdge();
            const edgesFromSource = graph.edges[srcNodeName] || [];
            const edge = edgesFromSource.filter((e: Edge) => e.destNode === destNodeName)[0];
            setSelectedEdge(edge);
            setShowEdgePanel(true);
        }
    };

    const renderAgentPanel = () => {
        if (!selectedAgent) {
            return <></>;
        }
        const decisionConfigName: Record<string, string> = { "scorer": "Instruction", "gatekeeper": "Question", "classifier": "Options" };
        const agentColorMap = () => {
            return selectedAgent.name === graph.entryNode ? "#13b81b" : (
                selectedAgent.agentType === "responder" ? "royalblue" : "orange"
            );
        };

        return (
            <section className="panel-container" style={{ border: `2px solid ${agentColorMap()}` }}>
                <header className="agents-container-header">
                    <h3>Agent Info</h3>
                    <div className="agents-container-header-button">
                        <button className="graph-button-green"
                            onClick={() => { onSetEntry(selectedAgent.name); }}
                            disabled={selectedAgent.name === graph.entryNode}>Set Entry</button>
                        <button className="graph-button"
                            onClick={() => setShowEditAgent(true)}>Edit</button>
                        <button className="graph-button-red"
                            onClick={() => setShowDeleteAgent(true)}
                            disabled={selectedAgent.name === graph.entryNode}>Delete</button>
                    </div>
                </header>

                <div className="panel-info-container">
                    <div className="panel-info-row">
                        <h4>Name: </h4>
                        <span>{selectedAgent.name}</span>
                    </div>
                    <div className="panel-info-row">
                        <h4>Agent Type: </h4>
                        <span>{selectedAgent.agentType}</span>
                    </div>
                    {selectedAgent.agentType === "responder" ? (
                        <div className="panel-info-row">
                            <h4>Prompt: </h4>
                            <span>{selectedAgent.promptName ? selectedAgent.promptName : "No prompt selected"}</span>
                        </div>
                    ) : (
                        <>
                            <div className="panel-info-row">
                                <h4>Output Field: </h4>
                                <span>{selectedAgent.outputField}</span>
                            </div>
                            <div className="panel-info-row">
                                <h4>{decisionConfigName[selectedAgent.agentType]}: </h4>
                                <span>{selectedAgent.agentType === "classifier" ? (
                                    Object.values(selectedAgent.decisionConfig!)[0].join(" / ")
                                ) : (
                                    Object.values(selectedAgent.decisionConfig!)[0]
                                )}</span>
                            </div>
                        </>
                    )}
                </div>
            </section>
        );
    };

    const renderEdgePanel = () => {
        if (!selectedEdge) {
            return <></>;
        }

        return (
            <section className="panel-container">
                <header className="agents-container-header">
                    <h3>Edge Info</h3>
                    <div className="agents-container-header-button">
                        <button onClick={() => { setShowEditEdge(true); }}>Edit</button>
                        <button className="graph-button-red" onClick={() => { setShowDeleteEdge(true); }}>Delete</button>
                    </div>
                </header>

                <div className="panel-info-container">
                    <div className="panel-info-row">
                        <h4>Source: </h4>
                        <span>{selectedEdge.srcNode}</span>
                    </div>
                    <div className="panel-info-row">
                        <h4>Destination: </h4>
                        <span>{selectedEdge.destNode}</span>
                    </div>
                    <div className="panel-info-row">
                        <h4>Condition: </h4>
                        <span>
                            "{graph.nodes[selectedEdge.srcNode].outputField}"{" "}
                            {graph.nodes[selectedEdge.srcNode].agentType === "scorer" ? MathDisplayMap[selectedEdge.condition.operator] : "is"}{" "}
                            {`${selectedEdge.condition.value}`}
                        </span>
                    </div>
                </div>
            </section>
        );
    };

    const renderAgentList = () => {
        const agents = Object.values(graph.nodes) as AgentNode[];

        return (
            <div>
                {
                    (!graph || agents.length === 0) ? (
                        <span className="list-empty">No agents yet</span>
                    ) : (
                        <div className="agent-list">
                            {
                                agents.map((agent: AgentNode) =>
                                    <div
                                        key={agent.name}
                                        className={`agent-row 
                                            ${selectedAgent?.name === agent.name ? "selected-agent-row" : ""}
                                            ${selectedEdge?.srcNode === agent.name || selectedEdge?.destNode === agent.name ? "selected-edge-agent-row" : ""}`}
                                    >
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
                                                {agent.agentType === "responder" && agent.promptName && <span className="agent-card prompt">{agent.promptName}</span>}
                                                {agent.agentType !== "responder" && <span className="agent-card output">{agent.outputField}</span>}
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    )
                }
            </div>
        );
    };

    return (
        <main className="graph-manager-container">
            <div id="a" className="agents-container-main">
                {showAgentPanel && renderAgentPanel()}
                {showEdgePanel && renderEdgePanel()}
                <section className="agents-container">
                    <header className="agents-container-header">
                        <h3>Agent List</h3>
                        <div className="agents-container-header-button">
                            <button onClick={() => setShowAddEdge(true)}>Add Edge</button>
                            <button className="graph-button-red" onClick={() => setShowResetGraph(true)}>Reset Graph</button>
                        </div>
                    </header>

                    {renderAgentList()}
                    <button className="add-agent-button" onClick={() => setShowAddAgent(true)}>+</button>
                </section>
            </div>

            <section className="graph-container">
                <GraphCanvas graph={graph} selectedAgent={selectedAgent} selectedEdge={selectedEdge} onClickAgent={onClickAgent} onClickEdge={onClickEdge} />
            </section>

            {showAddEdge && <EdgeFormModal key={showAddEdge ? "open" : "close"} mode="add" graph={graph} onCloseEdgeForm={onCloseEdgeForm} onSubmitEdgeForm={onSubmitEdgeForm} />}
            {showEditEdge && <EdgeFormModal key={showEditEdge ? "open" : "close"} mode="edit" selectedEdge={selectedEdge!} graph={graph} onCloseEdgeForm={onCloseEdgeForm} onSubmitEdgeForm={onSubmitEdgeForm} />}
            {showAddAgent && <AgentFormModal key={showAddAgent ? "open" : "close"} mode="add" onCloseAgentForm={onCloseAgentForm} onSubmitAgentForm={onSubmitAgentForm} />}
            {showEditAgent && <AgentFormModal key={showEditAgent ? "open" : "close"} mode="edit" selectedAgent={selectedAgent!} onCloseAgentForm={onCloseAgentForm} onSubmitAgentForm={onSubmitAgentForm} />}
            {showResetGraph && <WarningModal key={showResetGraph ? "open" : "close"} action="reset the graph" label="Reset" onClose={onCloseResetGraph} handler={handleReset} />}
            {showDeleteAgent && <WarningModal key={showDeleteAgent ? "open" : "close"} action="delete agent" target={selectedAgent!.name} label="Delete" onClose={onCloseDeleteAgent} handler={handleDeleteAgent} />}
            {showDeleteEdge && <WarningModal key={showDeleteEdge ? "open" : "close"} action="delete edge" target={`${selectedEdge!.srcNode} → ${selectedEdge!.destNode}`} label="Delete" onClose={onCloseDeleteEdge} handler={handleDeleteEdge} />}
        </main>
    );
}