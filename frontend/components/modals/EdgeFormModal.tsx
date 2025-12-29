import { useEffect, useState } from "react";
import { type ClassificationConfig, type Edge, type Graph, type AgentNode, type GraphOperator, type MathOperator, MathDisplayMap, MathOperatorMap } from "../../types/graph";
import DropdownMenu from "../items/DropdownMenu";
import api from "../../utils/api";
import InputRow from "../items/InputRow";
import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";

export default function EdgeFormModal({ graph, mode, selectedEdge, onCloseEdgeForm, onSubmitEdgeForm }: {
    graph: Graph,
    mode: "add" | "edit",
    selectedEdge?: Edge,
    onCloseEdgeForm: Function,
    onSubmitEdgeForm: Function;
}) {
    const agents = Object.values(graph.nodes) as AgentNode[];
    const agentNames: string[] = agents.map((agent: AgentNode) => agent.name);
    const decisionAgentNames: string[] = agents
        .filter((agent: AgentNode) => agent.agentType !== "responder")
        .map((agent: AgentNode) => agent.name);



    const [sourceAgent, setSourceAgent] = useState<AgentNode>();
    const [destAgent, setDestAgent] = useState<AgentNode>();
    const [operator, setOperator] = useState<string>("");
    const [value, setValue] = useState<string>("");
    const [error, setError] = useState<string>("");

    const populateData = () => {
        if (mode === "add" || !selectedEdge) {
            return;
        }
        setSourceAgent(graph.nodes[selectedEdge.srcNode]);
        setDestAgent(graph.nodes[selectedEdge.destNode]);

        if (selectedEdge.condition) {
            const srcAgent = graph.nodes[selectedEdge.srcNode];
            if (srcAgent.agentType === "scorer") {
                setOperator(MathDisplayMap[selectedEdge.condition.operator]);
            } else {
                setOperator("equals");
            }
            setValue(`${selectedEdge.condition.value}`);
        }
    };

    useEffect(() => {
        populateData();
    }, []);

    const onSelectSourceAgent = (agentName: string) => {
        setSourceAgent(graph.nodes[agentName]);
        setOperator("");
        setValue("");
    };

    const onSelectDestAgent = (agentName: string) => {
        setDestAgent(graph.nodes[agentName]);
    };

    const onSelectOperator = (operator: string) => {
        setOperator(operator);
    };

    const onSelectValue = (value: string) => {
        setValue(value);
    };

    const submitDisabled = () => {
        if (!sourceAgent || !destAgent || !operator || !value.trim()) {
            return true;
        }
        return false;
    };

    const parseConditionValue = (
        rawValue: string,
        agentType: AgentNode["agentType"]
    ): string | number | boolean => {
        if (agentType === "gatekeeper") {
            if (rawValue === "true") return true;
            if (rawValue === "false") return false;
            throw new Error("Invalid boolean value");
        }

        if (agentType === "scorer") {
            const num = Number(rawValue);
            if (Number.isNaN(num)) {
                throw new Error("Invalid numeric value");
            }
            return num;
        }

        return rawValue.trim();
    };

    const packEdge = (): Edge => {
        if (!sourceAgent || !destAgent) {
            throw new Error("Source or destination agent missing");
        }

        if (!operator || !value || sourceAgent.agentType === "responder") {
            throw new Error("Incomplete conditional edge");
        }

        let apiOperator: GraphOperator;

        if (sourceAgent.agentType === "scorer") {
            apiOperator = MathOperatorMap[operator as MathOperator];
        } else {
            apiOperator = "eq";
        }

        if (!apiOperator) {
            throw new Error(`Unsupported operator: ${operator}`);
        }

        const parsedValue = parseConditionValue(value, sourceAgent.agentType);
        if (parsedValue === null || parsedValue === undefined) {
            throw new Error("Invalid empty value");
        }

        return {
            srcNode: sourceAgent.name,
            destNode: destAgent.name,
            condition: {
                operator: apiOperator,
                value: parsedValue,
            },
        };
    };

    const handleAddEdge = async () => {
        setError("");

        try {
            const edge = packEdge();
            let response;
            if (mode === "edit") {
                response = await api.graph.editEdge(edge);
            } else {
                response = await api.graph.addEdge(edge);
            }
            console.log(response);
            onSubmitEdgeForm(edge);
            onCloseEdgeForm();
        } catch (err: any) {
            setError(err.message || "Failed to add edge. Please try again.");
        }
    };

    const renderValue = () => {
        if (!sourceAgent) {
            return <></>;
        }

        if (sourceAgent.agentType === "gatekeeper") {
            return <DropdownMenu key={`${sourceAgent.name} condition-value`} title="Value" value={value} placeholder="Select Boolean Value" options={["true", "false"]} onSelect={onSelectValue} />;
        } else if (sourceAgent.agentType === "scorer") {
            return (
                <InputRow key={`${sourceAgent.name} condition-value`} title="Value" placeholder="Enter numeric value" value={value} onChange={setValue} />
            );
        } else if (sourceAgent.agentType === "classifier") {
            return <DropdownMenu key={`${sourceAgent.name} condition-value`} title="Value" value={value} placeholder="Select Classification" options={(sourceAgent.decisionConfig as ClassificationConfig)?.options ?? []} onSelect={onSelectValue} />;
        }
    };

    const renderCondition = () => {
        if (!sourceAgent) {
            return <></>;
        }

        const getOperatorOptions = (): string[] => {
            switch (sourceAgent.agentType) {
                case "classifier":
                case "gatekeeper":
                    return ["equals"];
                case "scorer":
                    return ["=", ">", "<", "≥", "≤"];
                default:
                    return [];
            }
        };

        const operatorOptions = getOperatorOptions();

        return (
            <>
                {operatorOptions.length > 0 && (
                    <DropdownMenu
                        key={`${sourceAgent.name} condition-operator`}
                        title="Operator"
                        value={operator}
                        placeholder="Select Operator"
                        options={operatorOptions}
                        onSelect={onSelectOperator}
                    />
                )}
                {operator && renderValue()}
            </>
        );
    };

    return (
        <div className="modal-overlay">
            <section className="add-edge-modal-container">
                <ModalHeader title={`${mode === "edit" ? "Edit" : "Add"} Edge`} onClose={onCloseEdgeForm} />

                <div className="add-edge-modal-body">
                    <p>*Source agent must be a decision agent (not a responder)</p>
                    <DropdownMenu
                        title="Source Agent"
                        value={sourceAgent ? sourceAgent.name : ""}
                        disabled={selectedEdge != null}
                        placeholder="Select Source Agent"
                        options={decisionAgentNames}
                        onSelect={onSelectSourceAgent}
                    />
                    <DropdownMenu
                        title="Destination Agent"
                        value={destAgent ? destAgent.name : ""}
                        disabled={selectedEdge != null}
                        placeholder="Select Destination Agent"
                        options={agentNames}
                        onSelect={onSelectDestAgent}
                    />

                    {sourceAgent && destAgent && renderCondition()}
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <ModalFooter
                    submitLabel={`${mode === "edit" ? "Save" : "Add"}`}
                    submitStyle="confirm"
                    onClose={onCloseEdgeForm}
                    onSubmit={handleAddEdge}
                    isDisabled={submitDisabled()}
                />
            </section>
        </div>
    );
}