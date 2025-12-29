from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from typing import List, Optional, Dict, Literal, Union


class CaseModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class File(CaseModel):
    name: str
    created_at: str


class Chunk(CaseModel):
    index: int
    content: str
    embedding: List[float]
    score: Optional[float] = None


class QueryRequest(CaseModel):
    query: str


class ClassificationConfig(CaseModel):
    options: List[str]


class BooleanConfig(CaseModel):
    question: str


class NumericConfig(CaseModel):
    instruction: str


class AgentNode(CaseModel):
    name: str
    agent_type: Literal["classifier", "gatekeeper", "scorer", "responder"]

    output_field: Optional[str] = None
    decision_config: Optional[
        Union[
            ClassificationConfig,
            BooleanConfig,
            NumericConfig,
        ]
    ] = None

    prompt_name: Optional[str] = None


class Condition(CaseModel):
    operator: Literal["eq", "gt", "lt", "gte", "lte"]
    value: Union[str, bool, float, int]


class Edge(CaseModel):
    src_node: str
    dest_node: str
    condition: Condition


class Graph(CaseModel):
    entry_node: str
    nodes: Dict[str, AgentNode]
    edges: Dict[str, List[Edge]]


class InputVariableConfig(CaseModel):
    input_role: str
    description: str


class PromptTemplate(CaseModel):
    name: str
    description: str
    context_system_prompt: str
    template: str
    input_variables: Dict[str, InputVariableConfig]


class GuidedTemplateValue(CaseModel):
    persona: str
    goal: str
    style: str


class StructuredTemplateValue(CaseModel):
    system_header: str
    persona_block: str
    style_block: str


class RawTemplateValue(CaseModel):
    raw_system_prompt: str


class Prompt(CaseModel):
    name: str
    template: Literal["guided_template", "structured_template", "raw_template"]
    variable_value: Union[
        GuidedTemplateValue, StructuredTemplateValue, RawTemplateValue
    ]
    use_context: bool
    saved_at: Optional[str] = None


class Requirement(CaseModel):
    name: str
    passed: bool
    message: str


class DuplicateCondition(CaseModel):
    src_node: str
    dest_nodes: List[str]
    condition: str


class MissingRoute(CaseModel):
    src_node: str
    missingValue: str


class Validation(CaseModel):
    can_proceed: bool
    requirements: List[Requirement]
    unreachable_agents: List[str]
    duplicate_conditions: List[DuplicateCondition]
    missing_routes: List[MissingRoute]


class RespondTrace(CaseModel):
    agent: str
    agent_type: Literal["responder"]
    prompt: str
    output: str


class RouteTrace(CaseModel):
    agent: str
    agent_type: Literal["classifier", "gatekeeper", "scorer"]
    output_field: str
    output_value: Union[str, bool, float, int]
    reason: str
    next_node: str
    matched_condition: str


class RetrievedChunk(CaseModel):
    file_name: str
    chunk_index: int
    content: str
    distance: float
    score: float


class Result(CaseModel):
    query: str
    chunks: List[RetrievedChunk]
    context: str
    traces: List[Union[RespondTrace, RouteTrace]]
    graph: Graph
