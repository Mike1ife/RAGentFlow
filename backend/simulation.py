from typing import List
from pgvector import Vector

from schema import (
    Requirement,
    DuplicateCondition,
    MissingRoute,
    Validation,
    RespondTrace,
    RouteTrace,
    RetrievedChunk,
    Result,
)
from database import conn
from file import get_chunk_count
from graph import GraphManager, State
from models import embedding, reranking


class Validator:
    def __init__(self, graph_manager: GraphManager):
        self.graph_manager = graph_manager
        self._operator_name = {"eq": "=", "gt": ">", "lt": "<", "gte": "≥", "lte": "≤"}

    def validate_simulation(self) -> Validation:
        requirements = self._check_requirements()
        unreachable_agents = self._check_unreachable_agents()
        duplicate_conditions = self._check_duplicate_conditions()
        missing_routes = self._check_missing_routes()

        return Validation(
            can_proceed=all(req.passed for req in requirements),
            requirements=requirements,
            unreachable_agents=unreachable_agents,
            duplicate_conditions=duplicate_conditions,
            missing_routes=missing_routes,
        )

    def _check_requirements(self) -> List[Requirement]:
        requirements = []

        # 1. Responder must all have prompt
        graph = self.graph_manager.get_graph()
        responders_without_prompts = [
            name
            for name, node in graph.nodes.items()
            if node.agent_type == "responder" and not node.prompt_name
        ]
        requirements.append(
            Requirement(
                name="responders_have_prompts",
                passed=len(responders_without_prompts) == 0,
                message=(
                    f"Responder without prompt: {', '.join(responders_without_prompts)}"
                    if responders_without_prompts
                    else "All responders have prompts"
                ),
            )
        )

        # 2. At least one file for RAG
        chunk_count = get_chunk_count()
        requirements.append(
            Requirement(
                name="files_uploaded",
                passed=chunk_count > 0,
                message=(
                    "No files uploaded - RAG requires at least one document"
                    if chunk_count == 0
                    else f"{chunk_count} document chunks available for RAG"
                ),
            )
        )

        return requirements

    def _check_unreachable_agents(self) -> List[str]:
        # DFS
        graph = self.graph_manager.get_graph()
        stack = [graph.entry_node]
        visited = set()

        while stack:
            node_name = stack.pop()
            if node_name in visited:
                continue
            visited.add(node_name)

            for edge in graph.edges.get(node_name, []):
                if edge.dest_node not in visited:
                    stack.append(edge.dest_node)

        return [node_name for node_name in graph.nodes if node_name not in visited]

    def _check_duplicate_conditions(self) -> List[DuplicateCondition]:
        graph = self.graph_manager.get_graph()

        duplicate_conditions = []
        for src_node, edges in graph.edges.items():
            condition_map = {}
            for edge in edges:
                key = (
                    f"{self._operator_name[edge.condition.operator]} {edge.condition.value}"
                    if graph.nodes[edge.src_node].agent_type == "scorer"
                    else f"{edge.condition.value}"
                )
                condition_map.setdefault(key, []).append(edge.dest_node)

            for condition, dest_nodes in condition_map.items():
                if len(dest_nodes) > 1:
                    duplicate_conditions.append(
                        DuplicateCondition(
                            src_node=src_node,
                            dest_nodes=dest_nodes,
                            condition=condition,
                        )
                    )

        return duplicate_conditions

    def _check_missing_routes(self) -> List[MissingRoute]:
        graph = self.graph_manager.get_graph()
        missing_routes = []

        for node_name, node in graph.nodes.items():
            if node.agent_type == "responder":
                continue

            edges = graph.edges.get(node_name, [])

            if not edges:
                missing_routes.append(
                    MissingRoute(src_node=node_name, missingValue="No outgoing edges")
                )
                continue

            if node.agent_type == "classifier":
                options = set(node.decision_config.options)
                convered = {edge.condition.value for edge in edges}
                missing = options - convered
                if missing:
                    missing_routes.append(
                        MissingRoute(
                            src_node=node_name, missingValue=" / ".join(missing)
                        )
                    )
            elif node.agent_type == "gatekeeper":
                cover_true = any(edge.condition.value for edge in edges)
                cover_false = any(not edge.condition.value for edge in edges)

                missing = []
                if not cover_true:
                    missing.append("True")
                if not cover_false:
                    missing.append("False")

                if missing:
                    missing_routes.append(
                        MissingRoute(
                            src_node=node_name, missingValue=" / ".join(missing)
                        )
                    )
            elif node.agent_type == "scorer":
                operators = {edge.condition.operator for edge in edges}
                if len(operators) == 1:
                    missing_routes.append(
                        MissingRoute(
                            src_node=node_name,
                            missingValue="Consider adding more comparisons",
                        )
                    )

        return missing_routes


class Executor:
    def __init__(self, graph_manager: GraphManager):
        self.graph_manager = graph_manager
        self.runtime = None
        self.query = ""
        self.chunks = []
        self.context = ""
        self.last_result = None

    def get_last_result(self):
        return self.last_result

    def run(self):
        final_state = self.runtime.invoke(State(query=self.query, context=self.context))
        traces = []
        for trace in final_state["traces"]:
            if trace["agent_type"] == "responder":
                traces.append(
                    RespondTrace(
                        agent=trace["agent"],
                        agent_type=trace["agent_type"],
                        prompt=trace["prompt"],
                        output=trace["output"],
                    )
                )
            else:
                traces.append(
                    RouteTrace(
                        agent=trace["agent"],
                        agent_type=trace["agent_type"],
                        output_field=trace["output_field"],
                        output_value=trace["output_value"],
                        reason=trace["reason"],
                        next_node=trace.get("next_node", "__end__"),
                        matched_condition=trace.get("matched_condition", "N/A"),
                    )
                )

        self.last_result = Result(
            query=final_state["query"],
            chunks=self.chunks,
            context=final_state["context"],
            traces=traces,
            graph=self.graph_manager.get_graph(),
        )

    def compile_graph(self, query: str):
        self.query = query
        self.chunks.clear()
        self.context = self._retrieve_context(query=query)
        self.runtime = self.graph_manager.compile_graph()

    def _retrieve_context(self, query: str) -> str:
        queryEmbed = embedding.embed_query(query)
        queryVector = Vector(queryEmbed)

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT file_name, chunk_index, content, embedding <=> %s AS distance
                FROM doc_chunks
                ORDER BY distance
                LIMIT 10;
                """,
                (queryVector,),
            )
            results = cur.fetchall()

        pairs = [(query, r[2]) for r in results]
        scores = reranking.predict(pairs)

        # ((file_name, chunk_index, content, distance), score)
        rankedRes = sorted(zip(results, scores), key=lambda x: x[1], reverse=True)

        context = ""
        for (file_name, chunk_index, content, distance), score in rankedRes[:3]:
            context += f"[Source: {file_name}]\n{content}\n\n"
            self.chunks.append(
                RetrievedChunk(
                    file_name=file_name,
                    chunk_index=chunk_index,
                    content=content,
                    distance=distance,
                    score=score,
                )
            )

        return context
