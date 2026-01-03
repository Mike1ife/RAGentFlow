import "./styles/Dashboard.css";
import "./styles/Modal.css";
import "./styles/Item.css";
import { useEffect, useState } from "react";
import { Atom, ChartNetwork, FileText, Form, LayoutDashboard } from "lucide-react";
import Overview from "./Overview";
import { FileStorage } from "./FileStorage";
import GraphManager from "./GraphManager";
import PromptManager from "./PromptManager";
import StartModal from "./modals/StartModal";
import { type validTabs } from "../types/tab";
import type { Validation } from "../types/simulation";
import api from "../utils/api";
import ResultVisual from "./ResultVisual";
import TutorialsModal from "./modals/TutorialsModal";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<validTabs>("overview");
    const [waitResult, setWaitResult] = useState<boolean>(false);
    const [showStart, setShowStart] = useState<boolean>(false);
    const [showTutorials, setShowTutorials] = useState<boolean>(false);

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
        setShowStart(true);
    };

    const onCloseStart = () => {
        setShowStart(false);
    };

    const onStart = async (query: string) => {
        setActiveTab("result");
        setWaitResult(true);
        setShowStart(false);

        const data = await api.simulation.runSimulation(query);
        console.log(data);
    };

    const onClickResultTab = () => {
        setActiveTab('result');
        setWaitResult(false);
    };

    const onClickTutorials = () => {
        setShowTutorials(true);
    };

    const onCloseTutorials = () => {
        setShowTutorials(false);
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
                <h1>RAGentFlow</h1>
                <div className="header-button">
                    <button className="tutorial-button" onClick={onClickTutorials}>💡Tutorials</button>
                    <button onClick={onClickStartSimulation}>🚀 Start RAG & MAS Simulation</button>
                </div>
            </header>

            {renderTabs()}
            {renderMain()}

            {showStart && <StartModal validation={validation!} onClose={onCloseStart} onStart={onStart} />}
            {showTutorials && <TutorialsModal currentTab={activeTab} onClose={onCloseTutorials} />}
        </div>
    );
}