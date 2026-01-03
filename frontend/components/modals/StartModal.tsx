import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";
import type { DuplicateCondition, MissingRoute, Requirement, Validation } from "../../types/simulation";
import { Check, CircleAlert, X } from "lucide-react";
import { useState } from "react";

export default function StartModal({ validation, onClose, onStart }: {
    validation: Validation,
    onClose: Function,
    onStart: Function;
}) {
    const [currentPage, setCurrentPage] = useState<"validation" | "query">("validation");
    const [query, setQuery] = useState<string>("");

    const handleNext = () => {
        setCurrentPage("query");
    };

    const handlePrevious = () => {
        setCurrentPage("validation");
    };

    const handleStart = () => {
        onStart(query);
    };

    const renderRequirements = () => {
        if (!validation) {
            return <></>;
        }

        return (
            <div className="validation-content">
                <div className="validation-requirement-container">
                    <h3>Requirements</h3>
                    <div className="validation-requirement-body">
                        {validation.requirements.map((requirement: Requirement) => (
                            <div key={requirement.name} className="validation-content-row">
                                {requirement.passed ?
                                    <Check size={16} color="green" strokeWidth="3px" /> :
                                    <X size={16} color="red" strokeWidth="3px" />}
                                <span>{requirement.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderWarnings = () => {
        if (!validation) {
            return <></>;
        }

        return (
            <div className="validation-content">
                {validation.unreachableAgents.length > 0 && (
                    <div className="validation-warning-container">
                        <div className="validation-warning-title">
                            <CircleAlert size={16} color="orange" strokeWidth="3px" />
                            <span>Unreachable Agents</span>
                        </div>
                        <div className="validation-warning-body">
                            <div className="validation-warning-row">
                                {validation.unreachableAgents.join(" / ")}
                            </div>
                        </div>
                    </div>)}

                {validation.duplicateConditions.length > 0 && (
                    <div className="validation-warning-container">
                        <div className="validation-warning-title">
                            <CircleAlert size={16} color="orange" strokeWidth="3px" />
                            <span>Duplicate Edge Conditions</span>
                        </div>
                        <div className="validation-warning-body">
                            {validation.duplicateConditions.map((duplicateCondition: DuplicateCondition, index: number) => (
                                <div key={`duplicate-${index}`} className="validation-warning-row">
                                    {duplicateCondition.srcNode} → {duplicateCondition.destNodes.join(" / ")} ({duplicateCondition.condition})
                                </div>
                            ))}
                        </div>
                    </div>)}

                {validation.missingRoutes.length > 0 && (
                    <div className="validation-warning-container">
                        <div className="validation-warning-title">
                            <CircleAlert size={16} color="orange" strokeWidth="3px" />
                            <span>Missing Routes</span>
                        </div>
                        <div className="validation-warning-body">
                            {validation.missingRoutes.map((missingRoute: MissingRoute, index: number) => (
                                <div key={`missing-${index}`} className="validation-warning-row">
                                    {missingRoute.srcNode} ({missingRoute.missingValue})
                                </div>
                            ))}
                        </div>
                    </div>)}
            </div>
        );
    };

    return (
        <div className="modal-overlay">
            <section className="validation-modal-container">
                <ModalHeader
                    title={currentPage === "validation" ? "Validation" : "Query"}
                    onClose={onClose}
                />

                <div className="validation-modal-body">
                    {currentPage === "validation" ? (
                        <>
                            {renderRequirements()}
                            {renderWarnings()}
                        </>
                    ) : (
                        <textarea
                            className="query-text-area"
                            placeholder="Enter your query here..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    )}
                </div>

                {currentPage === "validation" ? (
                    <ModalFooter
                        submitLabel="Next"
                        submitStyle="confirm"
                        onClose={onClose}
                        onSubmit={handleNext}
                        isDisabled={!validation || !validation.canProceed}
                    />
                ) : (
                    <ModalFooter
                        cancelLabel="Previous"
                        submitLabel="Submit"
                        submitStyle="confirm"
                        onClose={handlePrevious}
                        onSubmit={handleStart}
                        isDisabled={query.trim().length === 0}
                    />
                )}
            </section>
        </div>
    );
}