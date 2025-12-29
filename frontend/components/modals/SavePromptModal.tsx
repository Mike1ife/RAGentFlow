import { useState } from "react";
import ModalFooter from "./ModalFooter";
import ModalHeader from "./ModalHeader";
import InputRow from "../items/InputRow";
import api from "../../utils/api";
import type { Prompt } from "../../types/prompt";

export default function SavePromptModal({ isNew, selectedPrompt, templateName, inputVariableValue, useContext, onCloseSave, onSaveSuccess }: {
    isNew: boolean,
    selectedPrompt: string,
    templateName: "guided_template" | "structured_template" | "raw_template",
    inputVariableValue: Record<string, string>,
    useContext: boolean,
    onCloseSave: Function,
    onSaveSuccess: Function;
}) {
    const [promptName, setPromptName] = useState<string>("");
    const [error, setError] = useState<string>("");

    const packGuidedTemplateValue = () => {
        return {
            "persona": inputVariableValue!["persona"],
            "goal": inputVariableValue!["goal"],
            "style": inputVariableValue!["style"]
        };
    };

    const packStructuredTemplateValue = () => {
        return {
            "systemHeader": inputVariableValue!["system_header"],
            "personaBlock": inputVariableValue!["persona_block"],
            "styleBlock": inputVariableValue!["style_block"]
        };
    };

    const packRawTemplateValue = () => {
        return {
            "rawSystemPrompt": inputVariableValue!["raw_system_prompt"],
        };
    };

    const packTemplateValue: Record<"guided_template" | "structured_template" | "raw_template", Function> = {
        "guided_template": packGuidedTemplateValue,
        "structured_template": packStructuredTemplateValue,
        "raw_template": packRawTemplateValue
    };

    const packPrompt = (): Prompt => {
        return {
            "name": (isNew ? promptName : selectedPrompt),
            "template": templateName,
            "variableValue": packTemplateValue[templateName](),
            "useContext": useContext
        };

    };

    const handleSave = async () => {
        setError("");
        try {
            const Prompt = packPrompt();
            let response;
            if (isNew) {
                response = await api.prompt.newPrompt(Prompt);
            } else {
                response = await api.prompt.updatePrompt(Prompt);
            }
            console.log(response);
            onSaveSuccess();
            onCloseSave();
        } catch (err: any) {
            setError(err.message || "Failed to save Prompt. Please try again.");
        }
    };


    return (
        <div className="modal-overlay">
            <section className="add-agent-modal-container">
                <ModalHeader title={`${isNew ? "New" : "Save"} Prompt Prompt`} onClose={onCloseSave} />
                {isNew && (
                    <>
                        <div className="add-agent-modal-body">
                            <InputRow title="Name" placeholder="Enter Prompt name" value={promptName} onChange={setPromptName} />
                        </div>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}
                    </>)}

                <ModalFooter submitLabel="Save" submitStyle="confirm" onClose={onCloseSave} onSubmit={handleSave} isDisabled={isNew && promptName.trim().length === 0} />
            </section>
        </div>
    );
}