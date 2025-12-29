import "./styles/Dashboard.css";
import "./styles/Modal.css";
import "./styles/Item.css";
import { useEffect, useState } from "react";
import { Atom, ChartNetwork, FileText, Form, LayoutDashboard } from "lucide-react";
import Overview from "./Overview";
import { FileStorage } from "./FileStorage";
import GraphManager from "./GraphManager";
import PromptManager from "./PromptManager";
import ValidationModal from "./modals/ValidationModal";
import InputQueryModal from "./modals/InputQueryModal";
import type { Validation } from "../types/simulation";
import api from "../utils/api";
import ResultVisual from "./ResultVisual";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<string>("");
    const [waitResult, setWaitResult] = useState<boolean>(false);
    const [showValidaiton, setShowValidation] = useState<boolean>(false);
    const [showInputQuery, setShowInputQuery] = useState<boolean>(false);

    const [validation, setValidation] = useState<Validation>();

    const loadValidation = async () => {
        const data = await api.simulation.getValidation();
        setValidation(data);
    };

    useEffect(() => {
        setActiveTab("overview");
    }, []);

    const onClickStartSimulation = () => {
        loadValidation();
        setShowValidation(true);
    };

    const onClose = () => {
        setShowValidation(false);
        setShowInputQuery(false);
    };

    const onNext = () => {
        setShowValidation(false);
        setShowInputQuery(true);
    };

    const onPrevious = () => {
        setShowInputQuery(false);
        setShowValidation(true);
    };

    const onStart = async (query: string) => {
        setActiveTab("result");
        setWaitResult(true);
        setShowValidation(false);
        setShowInputQuery(false);

        const data = await api.simulation.runSimulation(query);
        console.log(data);
    };

    const onClickResultTab = () => {
        setActiveTab('result');
        setWaitResult(false);
    };

    const renderTabs = () => {
        return (
            <nav className="tabs-container">
                <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                    <LayoutDashboard className="tab-icon" />
                    <span>Overview</span>
                </button>
                <button className={`tab ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
                    <FileText className="tab-icon" />
                    <span>Files</span>
                </button>
                <button className={`tab ${activeTab === 'graph' ? 'active' : ''}`} onClick={() => setActiveTab('graph')}>
                    <ChartNetwork className="tab-icon" />
                    <span>Graph</span>
                </button>
                <button className={`tab ${activeTab === 'prompt' ? 'active' : ''}`} onClick={() => setActiveTab('prompt')}>
                    <Form className="tab-icon" />
                    <span>Prompt</span>
                </button>
                <button className={`tab ${activeTab === 'result' ? 'active' : ''}`} onClick={onClickResultTab}>
                    <Atom className="tab-icon" />
                    <span>Result</span>
                </button>
            </nav>
        );
    };

    const renderMain = () => {
        switch (activeTab) {
            case "overview":
                return <Overview />;
            case "files":
                return <FileStorage />;
            case "graph":
                return <GraphManager />;
            case "prompt":
                return <PromptManager />;
            case "result":
                return <ResultVisual waitResult={waitResult} onResultReady={() => setWaitResult(false)} />;
            default:
                return <Overview />;
        }
    };

    return (
        <div className="dashboard">
            <header className="header-container">
                <h1>RAG MAS Visual</h1>
                <button onClick={onClickStartSimulation}>🚀 Start RAG & MAS Simulation</button>
            </header>

            {renderTabs()}
            {renderMain()}

            {showValidaiton && <ValidationModal validation={validation!} onClose={onClose} onNext={onNext} />}
            {showInputQuery && <InputQueryModal onClose={onClose} onPrevious={onPrevious} onStart={onStart} />}
        </div>
    );
}