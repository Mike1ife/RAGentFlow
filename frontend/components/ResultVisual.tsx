import "./styles/ResultVisual.css";
import type { RespondTrace, Result, RetrievedChunk, RouteTrace } from "../types/simulation";
import { ThreeDot } from "react-loading-indicators";
import { useEffect, useState } from "react";
import api from "../utils/api";
import AgentIcon from "./AgentIcon";
import { MathDisplayMap, type Edge, type GraphOperator } from "../types/graph";
import GraphCanvas from "./GraphCanvas";
import FullContentModal from "./modals/FullContentModal";
import { FileBraces } from "lucide-react";

export default function ResultVisual({ waitResult, onResultReady }: { waitResult: boolean, onResultReady: Function; }) {
    const [result, setResult] = useState<Result | null>(null);
    const [waitText, setWaitText] = useState<string>("Waiting for simulation result");
    const [selectRAG, setSelectRAG] = useState<boolean>(false);
    const [selectedTrace, setSelectedTrace] = useState<RespondTrace | RouteTrace | null>(null);

    const [showFullPrompt, setShowFullPrompt] = useState<boolean>(false);
    const [showFullChunk, setShowFullChunk] = useState<boolean>(false);
    const [selectedChunk, setSelectedChunk] = useState<RetrievedChunk | null>(null);

    const loadResult = async () => {
        try {

            setSelectRAG(false);
            setSelectedTrace(null);
            const data = await api.simulation.getResult();
            setResult(data);
        } catch (err: any) {
            console.error(err);
            setResult(null);
            if (waitResult) {
                setWaitText("Error occurs, check log");
            }
        } finally {
            if (waitResult) {
                onResultReady();
            }
        }
    };

    useEffect(() => {
        loadResult();
    }, []);

    useEffect(() => {
        if (waitResult) {
            loadResult();
        }
    }, [waitResult]);

    if (waitResult) {
        return (
            <main className="result-visual-container wait">
                <ThreeDot variant="bounce" color="#2563eb" size="large" text={waitText} />
            </main >
        );
    }

    if (!result) {
        return (
            <main className="result-visual-container empty">
                <p className="list-empty">No simulation result</p>
            </main >
        );
    }

    const onClickRAG = () => {
        setSelectRAG(!selectRAG);
        setSelectedTrace(null);
    };

    const onClickViewChunk = (chunk: RetrievedChunk) => {
        setSelectedChunk(chunk);
        setShowFullChunk(true);
    };

    const onClickTrace = (trace: RespondTrace | RouteTrace) => {
        if (trace.agent === selectedTrace?.agent) {
            setSelectedTrace(null);
        } else {
            setSelectRAG(false);
            setSelectedTrace(trace);
        }
    };

    const onClickAgent = (agentName: string) => {
        if (agentName === selectedTrace?.agent) {
            setSelectedTrace(null);
        } else {
            setSelectRAG(false);
            const targetTrace = result.traces.find((trace: RespondTrace | RouteTrace) => trace.agent === agentName) ?? null;
            setSelectedTrace(targetTrace);
        }
    };

    const onClickEdge = (srcNodeName: string, _: string) => {
        if (srcNodeName === selectedTrace?.agent) {
            setSelectedTrace(null);
        } else {
            setSelectRAG(false);
            const targetTrace = result.traces.find((trace: RespondTrace | RouteTrace) => trace.agent === srcNodeName) ?? null;
            setSelectedTrace(targetTrace);
        }
    };

    const onCloseFullPrompt = () => {
        setShowFullPrompt(false);
    };

    const onCloseFullChunk = () => {
        setShowFullChunk(false);
        setSelectedChunk(null);
    };

    const renderMatchedCondition = (trace: RouteTrace) => {
        if (trace.nextNode == "__end__") {
            return "END";
        }

        if (trace.agentType === "scorer") {
            const condition: string[] = trace.matchedCondition.split(' ', 2);
            const operator = condition[0];
            const value = condition[1];
            return `"${trace.outputField}" ${MathDisplayMap[operator as GraphOperator]} ${value}`;
        } else {
            return `"${trace.outputField}" ${trace.matchedCondition.replace("eq", "is")}`;
        }
    };

    const renderTraces = () => {
        return (
            <div className="trace-body">
                <div
                    className={`trace-row ${selectRAG ? "selected" : ""}`}
                    onClick={onClickRAG}>
                    <FileBraces size={50} />
                    <div className="trace-row-info">
                        <span className="trace-row-agent-name">RAG</span>
                        <span className="trace-row-agent-output">
                            View Retrieve Docs
                        </span>
                    </div>
                </div>
                {result.traces.map((trace: RespondTrace | RouteTrace) => (
                    <div
                        key={trace.agent}
                        className={`trace-row ${selectedTrace?.agent === trace.agent ? "selected" : ""}`}
                        onClick={() => onClickTrace(trace)}>
                        <AgentIcon agentType={trace.agentType} size={50} />
                        <div className="trace-row-info">
                            <span className="trace-row-agent-name">{trace.agent}</span>
                            <span className="trace-row-agent-output">
                                {trace.agentType === "responder" ?
                                    `"${trace.output.slice(0, 50)}......"` :
                                    renderMatchedCondition(trace)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderRAGDetail = () => {
        return (
            <div className="rag-detail-container">
                {result.chunks.map((chunk: RetrievedChunk, index: number) => (
                    <>
                        <div key={index} className="rag-detail-body">
                            <div className="trace-detail-item inline">
                                <h4>File:</h4>
                                <span>{chunk.fileName}</span>
                            </div>
                            <div className="trace-detail-item inline">
                                <h4>Chunk Index:</h4>
                                <span>{chunk.chunkIndex + 1}</span>
                            </div>
                            <div className="trace-detail-item inline">
                                <h4>Content:</h4>
                                <span
                                    className="view-full-content"
                                    onClick={() => onClickViewChunk(chunk)}>View Full Content</span>
                            </div>
                            <div className="trace-detail-item inline">
                                <h4>Similarity:</h4>
                                <span>{chunk.distance.toFixed(2)}</span>
                            </div>
                            <div className="trace-detail-item inline">
                                <h4>Relevance:</h4>
                                <span>{chunk.score.toFixed(2)}</span>
                            </div>
                        </div>
                        {index != result.chunks.length - 1 && <div className="chunk-divider" />}
                    </>
                ))}
            </div>
        );
    };

    const renderTraceDetail = () => {
        if (!selectedTrace) {
            return <span className="list-empty">Select a trace first</span>;
        }

        return (
            <div className="trace-detail-body">
                <div className="trace-detail-item inline">
                    <h4>Agent:</h4>
                    <span>{selectedTrace.agent}</span>
                </div>
                <div className="trace-detail-item inline">
                    <h4>Agent Type:</h4>
                    <span>{selectedTrace.agentType}</span>
                </div>
                {selectedTrace.agentType === "responder" ? (
                    <>
                        <div className="trace-detail-item inline">
                            <h4>Prompt:</h4>
                            <span
                                className="view-full-content"
                                onClick={() => setShowFullPrompt(true)}>View Full Prompt</span>
                        </div>
                        <div className="trace-detail-item block">
                            <h4>Response:</h4>
                            <span>{selectedTrace.output}</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="trace-detail-item inline">
                            <h4>Output Field:</h4>
                            <span>{selectedTrace.outputField}</span>
                        </div>
                        <div className="trace-detail-item inline">
                            <h4>Output Value:</h4>
                            <span>{String(selectedTrace.outputValue)}</span>
                        </div>
                        <div className="trace-detail-item block">
                            <h4>Reason:</h4>
                            <span>{selectedTrace.reason}</span>
                        </div>
                        <div className="trace-detail-item inline">
                            <h4>Next Node:</h4>
                            <span>{selectedTrace.nextNode}</span>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const selectedAgent = selectedTrace ? result.graph.nodes[selectedTrace.agent] : null;
    const selectedEdge = selectedTrace && selectedTrace.agentType != "responder" && selectedTrace.nextNode != "__end__" ?
        result.graph.edges[selectedTrace.agent].find((edge: Edge) => edge.destNode === selectedTrace.nextNode) ?? null :
        null;

    return (
        <main className="result-visual-container">
            <section className="trace-container">
                <h3>Traces</h3>
                {renderTraces()}
            </section>

            <section className="result-graph-container">
                <GraphCanvas
                    graph={result.graph}
                    selectedAgent={selectedAgent}
                    selectedEdge={selectedEdge}
                    onClickAgent={onClickAgent}
                    onClickEdge={onClickEdge} />
            </section>

            <section className="trace-detail-container">
                <h3>{selectRAG ? "Document Retrieval" : "Trace Detail"}</h3>
                {selectRAG ? renderRAGDetail() : renderTraceDetail()}
            </section>

            {showFullPrompt && selectedTrace?.agentType === "responder" && <FullContentModal title="Prompt" content={selectedTrace.prompt} onClose={onCloseFullPrompt} />}
            {showFullChunk && selectedChunk && <FullContentModal title={`${selectedChunk.fileName} (#${selectedChunk.chunkIndex + 1})`} content={selectedChunk.content} onClose={onCloseFullChunk} />}
        </main >
    );
}