import "./styles/PromptManager.css";
import { useEffect, useState } from "react";
import type { InputVariableConfig, PromptTemplate, Prompt, TemplateName } from "../types/prompt";
import api from "../utils/api";
import DropdownMenu from "./items/DropdownMenu";
import InputRow from "./items/InputRow";
import SavePromptModal from "./modals/SavePromptModal";
import WarningModal from "./modals/WarningModal";

function camelToSnake(key: string): string {
    return key
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .toLowerCase();
}

export default function PromptManager() {
    const [promptList, setPromptList] = useState<Prompt[]>([]);
    const [workspaceMode, setWorkspaceMode] = useState<"" | "new" | "edit">("");
    const [selectedPrompt, setSelectedPrompt] = useState<string>("");
    const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
    const [selectedTemplateLabel, setSelectedTemplateLabel] = useState("");
    const [inputVariableValue, setInputVariableValue] = useState<Record<string, string>>({});
    const [useContext, setUseContext] = useState<boolean>(false);

    const [showSavePrompt, setShowSavePrompt] = useState<boolean>(false);
    const [showDeletePrompt, setShowDeletePrompt] = useState<boolean>(false);

    const templateNameMap: Record<string, TemplateName> = {
        "Guided Template": "guided_template",
        "Structured Template": "structured_template",
        "Raw Template": "raw_template"
    };
    const onSelectTemplate = async (templateLabel: string) => {
        setSelectedTemplateLabel(templateLabel);

        const data = await api.prompt.getTemplate(templateNameMap[templateLabel]);

        const initialValues: Record<string, string> = {};
        Object.keys(data.inputVariables).forEach((key) => {
            const value = data.inputVariables[key];
            if (value.inputRole === "user_input") {
                initialValues[key] = "";
            }
        });

        setSelectedTemplate(data);
        setInputVariableValue(initialValues);
    };

    const loadPromptList = async () => {
        const data = await api.prompt.getPromptList();
        setPromptList(data);
    };

    useEffect(() => {
        loadPromptList();
    }, []);

    const onCloseSave = () => {
        setShowSavePrompt(false);
    };

    const onSaveSuccess = () => {
        loadPromptList();
    };

    const onCloseDelete = () => {
        setShowDeletePrompt(false);
    };

    const resetWorkspace = () => {
        setWorkspaceMode("");
        setSelectedPrompt("");
        setSelectedTemplate(null);
        setUseContext(false);
        setInputVariableValue({});
    };

    const handleDelete = async () => {
        const response = await api.prompt.deletePrompt(selectedPrompt);
        console.log(response);
        resetWorkspace();
        loadPromptList();
        onCloseDelete();
    };

    const onClickNew = () => {
        setWorkspaceMode("new");
        setSelectedPrompt("");
        setSelectedTemplate(null);
        setUseContext(false);
        setInputVariableValue({});
    };

    const normalizeVariableValue = (value: Prompt["variableValue"]): Record<string, string> => {
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [camelToSnake(k), String(v)])
        );
    };

    const onClickPrompt = async (index: number) => {
        const prompt = promptList.at(index);
        if (!prompt) return;

        if (prompt.name === selectedPrompt) {
            resetWorkspace();
            return;
        }

        const template = await api.prompt.getTemplate(prompt.template);

        const normalizedValues = normalizeVariableValue(prompt.variableValue);

        const valueedValues: Record<string, string> = {};

        (Object.entries(template.inputVariables) as [string, InputVariableConfig][])
            .forEach(([key, config]) => {
                if (config.inputRole === "user_input") {
                    valueedValues[key] = normalizedValues[key] ?? "";
                }
            });

        setSelectedPrompt(prompt.name);
        setWorkspaceMode("edit");
        setSelectedTemplate(template);
        setUseContext(prompt.useContext);
        setInputVariableValue(valueedValues);
    };


    const saveDisabled = () => {
        return !(Object.keys(inputVariableValue).length > 0 &&
            Object.values(inputVariableValue).every(
                (value: string) => value.trim().length !== 0
            ));
    };


    const renderPrompts = () => {
        return (
            <>
                <header className="prompt-container-header">
                    <h3>Prompt</h3>
                    <button className="new-prompt-button" onClick={onClickNew}>+ New</button>
                </header>

                <div>
                    {promptList.length === 0 ? (
                        <span className="list-empty">No prompt yet</span>
                    ) : (
                        <div className="prompt-list">
                            {
                                promptList.map((Prompt: Prompt, index: number) => (
                                    <div key={index}
                                        className={`prompt-row ${selectedPrompt === Prompt.name ? "selected" : ""}`}
                                        onClick={() => onClickPrompt(index)}>
                                        <div className="prompt-info-main">
                                            <span>{Prompt.name}</span>
                                            <div className={`prompt-template-card ${Prompt.template.replace("_template", "")}`}>
                                                {Prompt.template.replace("_template", "")}
                                            </div>
                                        </div>
                                        <span className="timestamp">Save at {Prompt.savedAt}</span>
                                    </div>
                                ))
                            }
                        </div>
                    )
                    }
                </div>
            </>
        );
    };

    const renderInputVariable = () => {
        if (!selectedTemplate) {
            return null;
        }

        return (
            <div className="workspace-body-container">
                <div className="use-context-toggle-container">
                    <span>RAG Context</span>
                    <div
                        className={`use-context-toggle ${useContext ? "right" : ""}`}
                        onClick={() => setUseContext(!useContext)}>
                        <div className="use-context-toggle-ball"></div>
                    </div>
                </div>
                <div className="input-variable-container">
                    {(Object.entries(selectedTemplate.inputVariables) as [string, InputVariableConfig][])
                        .map(([variable, config]) => (
                            (config.inputRole === "user_input" &&
                                <div key={variable}>
                                    <InputRow
                                        title={variable}
                                        placeholder={`Fill ${variable}`}
                                        value={inputVariableValue?.[variable] ?? ""}
                                        onChange={(val: string) =>
                                            setInputVariableValue(prev => ({
                                                ...prev,
                                                [variable]: val
                                            }))
                                        }
                                    />
                                    <p className="input-variable-description">{config.description}</p>
                                </div>
                            )
                        ))}
                </div>
            </div>
        );
    };

    const renderWorkspace = () => {
        if (workspaceMode === "") {
            return (
                <>
                    <header className="prompt-container-header">
                        <h3>Workspace</h3>
                    </header>
                    <span className="list-empty">Create or Edit a prompt</span>
                </>
            );
        }

        return (
            <>
                <header className="prompt-container-header">
                    <h3>{workspaceMode === "new" ? "New Prompt" : `Edit Prompt "${selectedPrompt}"`}</h3>

                    {workspaceMode === "new" && (
                        <DropdownMenu
                            title=""
                            value={selectedTemplateLabel}
                            placeholder="Select Template"
                            options={["Guided Template", "Structured Template", "Raw Template"]}
                            onSelect={onSelectTemplate}
                        />
                    )}
                </header>

                {renderInputVariable()}

                <footer className="prompt-workspace-footer">
                    <button onClick={() => setShowSavePrompt(true)} disabled={saveDisabled()}>
                        Save
                    </button>
                    {workspaceMode === "edit" && (
                        <button className="prompt-delete-button" onClick={() => setShowDeletePrompt(true)}>
                            Delete
                        </button>
                    )}
                </footer>
            </>
        );
    };


    const renderCompiledPrompt = () => {
        if (!selectedTemplate) return "";

        let compiled = selectedTemplate.template;
        if (useContext) {
            compiled = selectedTemplate.contextSystemPrompt + "\n---\n" + compiled;
        }

        Object.entries(selectedTemplate.inputVariables).forEach(([key, _]) => {
            const value = inputVariableValue?.[key];

            if (!value || !value.trim()) return;

            compiled = compiled.replace(
                new RegExp(`\\{${key}\\}`, "g"),
                value
            );
        });

        return compiled;
    };

    const renderPreview = () => {
        if (workspaceMode == "" || (workspaceMode == "new" && !selectedTemplate)) {
            return (
                <>
                    <header className="prompt-container-header">
                        <h3>Preview</h3>
                    </header>
                    <span className="list-empty">Select a prompt or template</span>
                </>
            );
        }

        return (
            <>
                <header className="prompt-container-header">
                    <h3>Preview</h3>
                </header>
                <div className="prompt-preview">
                    {renderCompiledPrompt()}
                </div>
            </>
        );
    };

    return (
        <div className="prompt-manager-container">
            <section className="prompt-container">
                {renderPrompts()}
            </section>

            <section className="prompt-workspace-container">
                {renderWorkspace()}
            </section>

            <section className="prompt-preview-container">
                {renderPreview()}
            </section>

            {workspaceMode && selectedTemplate && inputVariableValue && showSavePrompt &&
                <SavePromptModal key={showSavePrompt ? "open" : "close"} isNew={workspaceMode === "new"} selectedPrompt={workspaceMode === "edit" ? selectedPrompt : ""} templateName={selectedTemplate.name} inputVariableValue={inputVariableValue} useContext={useContext} onCloseSave={onCloseSave} onSaveSuccess={onSaveSuccess} />}
            {showDeletePrompt && <WarningModal key={showDeletePrompt ? "open" : "close"} action="delete prompt" target={selectedPrompt} label="Delete" onClose={onCloseDelete} handler={handleDelete} />}
        </div>
    );
}