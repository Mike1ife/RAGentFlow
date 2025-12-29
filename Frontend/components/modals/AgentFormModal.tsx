import { useEffect, useState } from "react";
import DropdownMenu from "../items/DropdownMenu";
import InputRow from "../items/InputRow";
import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";
import api from "../../utils/api";
import type { AgentNode } from "../../types/graph";

export default function AgentFormModal({ mode, selectedAgent, onCloseAgentForm, onSubmitAgentForm }: {
    mode: "add" | "edit",
    selectedAgent?: AgentNode,
    onCloseAgentForm: Function,
    onSubmitAgentForm: Function;
}) {
    const [agentName, setAgentName] = useState<string>("");
    const [agentType, setAgentType] = useState<string>("");
    const [outputField, setOutputField] = useState<string>("");
    const [decisionConfig, setDecisionConfig] = useState<string>("");
    const [classOptions, setClassOptions] = useState<string[]>([]);
    const [error, setError] = useState<string>("");

    const [promptName, setPromptName] = useState<string>("");
    const [promptList, setPromptList] = useState<string[]>([]);

    const loadPromptList = async () => {
        const data = await api.prompt.getPromptNames();
        setPromptList(data);
    };

    const populateData = () => {
        if (mode === "add" || !selectedAgent) {
            return;
        }
        setAgentName(selectedAgent.name);
        setAgentType(selectedAgent.agentType);

        if (selectedAgent.agentType === "responder") {
            if (selectedAgent.promptName) {
                setPromptName(selectedAgent.promptName);
            }
        } else {
            setOutputField(selectedAgent.outputField!);
            const config = selectedAgent.decisionConfig!;
            if ("question" in config) {
                setDecisionConfig(config.question);
            } else if ("instruction" in config) {
                setDecisionConfig(config.instruction);
            } else if ("options" in config) {
                setClassOptions(config.options);
            }
        }
    };

    useEffect(() => {
        populateData();
        loadPromptList();
    }, []);

    const packAgent = (): AgentNode => {
        const agent: AgentNode = {
            name: agentName.trim(),
            agentType: agentType as "classifier" | "gatekeeper" | "scorer" | "responder",
        };

        if (agentType === "responder") {
            if (promptName) {
                agent.promptName = promptName;
            }
            return agent;
        }

        agent.outputField = outputField.trim();

        if (agentType === "classifier") {
            agent.decisionConfig = {
                options: classOptions,
            };
        }

        if (agentType === "gatekeeper") {
            agent.decisionConfig = {
                question: decisionConfig.trim(),
            };
        }

        if (agentType === "scorer") {
            agent.decisionConfig = {
                instruction: decisionConfig.trim(),
            };
        }

        return agent;
    };

    const handleSubmitForm = async () => {
        setError("");

        try {
            const agent = packAgent();
            let response;
            if (mode === "edit") {
                response = await api.graph.editAgent(selectedAgent!.name, agent);
            } else {
                response = await api.graph.addAgent(agent);
            }

            console.log(response);
            onSubmitAgentForm(agent);
            onCloseAgentForm();
        } catch (err: any) {
            setError(err.message || "Failed to add agent. Please try again.");
        }
    };

    const onSelectAgentType = (agentType: string) => {
        setAgentType(agentType);
        setOutputField("");
        setDecisionConfig("");
        setClassOptions([]);
        setPromptName("");
    };

    const submitDisabled = () => {
        if (!agentName.trim() || !agentType) {
            return true;
        }

        if (agentType === "responder") {
            return false; // Prompt is optional for responders
        }

        // For decision agents
        if (!outputField.trim()) {
            return true;
        }

        if (agentType === "classifier") {
            return classOptions.length === 0;
        } else if (agentType === "gatekeeper" || agentType === "scorer") {
            return !decisionConfig.trim();
        }

        return false;
    };

    const addClassOption = () => {
        setError("");
        const trimmed = decisionConfig.trim();
        if (!trimmed) return;
        if (classOptions.includes(trimmed)) {
            setError("Duplicate options");
            return;
        }

        setClassOptions([...classOptions, trimmed]);
        setDecisionConfig("");
    };

    const removeClassOption = (option: string) => {
        setClassOptions(classOptions.filter(o => o !== option));
    };

    const renderClassificationConfig = () => {
        return (
            <div className="classification-config-container">
                <div className="add-option-container">
                    <InputRow title="Option" placeholder="(Ex: sports / finance / academic)" value={decisionConfig} onChange={setDecisionConfig} />
                    <button disabled={decisionConfig.trim().length === 0} onClick={addClassOption}>+</button>
                </div>

                <div className="options-container">
                    {classOptions && classOptions.map((value: string, index: number) => (
                        <div key={index} className="option">
                            <button onClick={() => removeClassOption(value)}>
                                <span>{value}</span>
                                <span>×</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderDecisionConfig = () => {
        if (agentType === "classifier") {
            return renderClassificationConfig();
        } else if (agentType === "scorer") {
            return (
                <InputRow title="Instruction" placeholder="(Ex: Score difficulty from 0 to 1)" value={decisionConfig} onChange={setDecisionConfig} />
            );
        } else if (agentType === "gatekeeper") {
            return (
                <InputRow title="Question" placeholder="(Ex: Is this query academic?)" value={decisionConfig} onChange={setDecisionConfig} />
            );
        }
    };

    const renderDecisionAgentFields = () => {
        return (
            <>
                <InputRow title="Output Field" placeholder="(Ex: intent / difficulty / is_academic)" value={outputField} onChange={setOutputField} />
                {renderDecisionConfig()}
            </>
        );
    };

    return (
        <div className="modal-overlay">
            <section className="add-agent-modal-container">
                <ModalHeader title={`${mode === "edit" ? "Edit" : "Add"} Agent`} onClose={onCloseAgentForm} />

                <div className="add-agent-modal-body">
                    <InputRow title="Name" placeholder="Enter agent name" value={agentName} onChange={setAgentName} />
                    <DropdownMenu
                        title="Type"
                        value={agentType}
                        placeholder="Select Agent Type"
                        options={["responder", "classifier", "gatekeeper", "scorer"]}
                        onSelect={onSelectAgentType}
                    />
                    {agentType === "responder" && (
                        <DropdownMenu
                            title="Prompt"
                            value={promptName}
                            placeholder="Select Prompt (Optional)"
                            options={promptList}
                            onSelect={setPromptName}
                        />
                    )}
                    {agentType && agentType !== "responder" && renderDecisionAgentFields()}
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <ModalFooter
                    submitLabel={mode === "edit" ? "Save" : "Add"}
                    submitStyle="confirm"
                    onClose={onCloseAgentForm}
                    onSubmit={handleSubmitForm}
                    isDisabled={submitDisabled()}
                />
            </section>
        </div>
    );
}