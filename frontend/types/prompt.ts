export interface InputVariableConfig {
    inputRole: string;
    description: string;
}

export type TemplateName = "guided_template" | "structured_template" | "raw_template";

export interface PromptTemplate {
    name: TemplateName;
    description: string;
    contextSystemPrompt: string;
    template: string;
    inputVariables: Record<string, InputVariableConfig>;
}

export interface GuidedTemplateValue {
    persona: string;
    goal: string;
    style: string;
}

export interface StructuredTemplateValue {
    systemHeader: string;
    personaBlock: string;
    styleBlock: string;
}

export interface RawTemplateValue {
    rawSystemPrompt: string;
}

export interface Prompt {
    name: string;
    template: TemplateName;
    variableValue: GuidedTemplateValue | StructuredTemplateValue | RawTemplateValue;
    useContext: boolean;
    savedAt?: string;
}