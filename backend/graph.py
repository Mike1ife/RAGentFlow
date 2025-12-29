import os
import json
from dotenv import load_dotenv
from langgraph.graph import StateGraph
from langgraph.graph.state import CompiledStateGraph
from typing import TypedDict, Dict, Any
from psycopg import Cursor
from psycopg.types.json import Json

from schema import AgentNode, Edge, Condition, Graph
from database import conn
from models import model
from prompt import PromptManager

load_dotenv()

API_KEY = os.getenv("API_KEY")


class State(TypedDict, total=False):
    query: str
    context: str
    traces: list
    data: Dict[str, Any]


def _classifier_agent(state: State, output_field: str, config: dict) -> dict:
    text = state["query"]
    options = config["options"]

    prompt = f"""
    Classify this text into one of these categories:
    {options}

    Text: "{text}"

    Return JSON: {{ 
        "value": "<category>",
        "reason": "<brief explanation why you chose this category>"
    }}
    """

    response = json.loads(model.invoke(prompt).content)
    value = response["value"]
    reason = response.get("reason", "")

    state.setdefault("data", {})[output_field] = value
    return {"value": value, "reason": reason}


def _gatekeeper_agent(state: State, output_field: str, config: dict) -> dict:
    text = state["query"]
    question = config["question"]

    prompt = f"""
    Given the text, answer the question with true or false only.

    Text: "{text}"
    Question: {question}

    Return JSON: {{ 
        "value": true/false,
        "reason": "<brief explanation for your decision>"
    }}
    """

    response = json.loads(model.invoke(prompt).content)
    value = bool(response["value"])
    reason = response.get("reason", "")

    state.setdefault("data", {})[output_field] = value
    return {"value": value, "reason": reason}


def _scorer_agent(state: State, output_field: str, config: dict) -> dict:
    text = state["query"]
    instruction = config["instruction"]

    prompt = f"""
    Given the text, compute a numeric value based on the following instruction.

    Text: "{text}"
    Instruction: {instruction}

    Return JSON: {{ 
        "value": <number>,
        "reason": "<brief explanation for this score>"
    }}
    """

    response = json.loads(model.invoke(prompt).content)
    value = float(response["value"])
    reason = response.get("reason", "")

    state.setdefault("data", {})[output_field] = value
    return {"value": value, "reason": reason}


class GraphManager:
    def __init__(self):
        self._agent_registry = {
            "classifier": _classifier_agent,
            "gatekeeper": _gatekeeper_agent,
            "scorer": _scorer_agent,
        }
        self._prompt_manager = PromptManager()

    def set_entry(self, node_name: str):
        with conn.cursor() as cur:
            cur.execute("CALL sp_set_entry_node(%s)", (node_name,))
        conn.commit()

    def node_exist(self, node_name: str) -> bool:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT EXISTS(SELECT 1 FROM agent_node WHERE name = %s);",
                (node_name,),
            )
            return cur.fetchone()[0]

    def add_node(self, node: AgentNode):
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO agent_node (name, agent_type, output_field, decision_config, prompt_name)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    node.name,
                    node.agent_type,
                    node.output_field,
                    (
                        Json(node.decision_config.model_dump())
                        if node.decision_config
                        else None
                    ),
                    node.prompt_name,
                ),
            )
        conn.commit()

    def delete_node(self, node_name: str):
        with conn.cursor() as cur:
            cur.execute("DELETE FROM agent_node WHERE name = %s", (node_name,))
        conn.commit()

    def update_node(self, node_name: str, node: AgentNode):
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE agent_node
                SET name = %s, agent_type = %s, output_field = %s, decision_config = %s, prompt_name = %s
                WHERE name = %s
                """,
                (
                    node.name,
                    node.agent_type,
                    node.output_field,
                    (
                        Json(node.decision_config.model_dump())
                        if node.decision_config
                        else None
                    ),
                    node.prompt_name,
                    node_name,
                ),
            )
        conn.commit()

    def edge_exist(self, src_node: str, dest_node: str) -> bool:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT EXISTS(SELECT 1 FROM edge WHERE src_node = %s AND dest_node = %s);",
                (src_node, dest_node),
            )
            return cur.fetchone()[0]

    def _can_reach(self, start: str, target: str, visited: set, cur: Cursor) -> bool:
        if start == target:
            return True

        cur.execute("SELECT dest_node FROM edge WHERE src_node = %s;", (start,))
        for (dest_node,) in cur.fetchall():
            if dest_node not in visited:
                visited.add(dest_node)
                if self._can_reach(dest_node, target, visited, cur):
                    return True

        return False

    def cause_cycle(self, edge: Edge) -> bool:
        with conn.cursor() as cur:
            return self._can_reach(edge.dest_node, edge.src_node, set(), cur)

    def add_edge(self, edge: Edge):
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO edge (src_node, dest_node, operator, value)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    edge.src_node,
                    edge.dest_node,
                    edge.condition.operator,
                    Json(edge.condition.value),
                ),
            )
        conn.commit()

    def delete_edge(self, src_node: str, dest_node: str):
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM edge WHERE src_node = %s AND dest_node = %s",
                (src_node, dest_node),
            )
        conn.commit()

    def update_edge(self, edge: Edge):
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE edge 
                SET operator = %s, value = %s
                WHERE src_node = %s AND dest_node = %s
                """,
                (
                    edge.condition.operator if edge.condition else None,
                    Json(edge.condition.value) if edge.condition else None,
                    edge.src_node,
                    edge.dest_node,
                ),
            )
        conn.commit()

    def get_graph(self) -> Graph:
        entry_node = ""
        nodes = {}
        edges = {}
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM agent_node")
            for (
                name,
                agent_type,
                is_entry,
                output_field,
                decision_config,
                prompt_name,
            ) in cur.fetchall():
                if is_entry:
                    entry_node = name
                nodes[name] = AgentNode(
                    name=name,
                    agent_type=agent_type,
                    output_field=output_field,
                    decision_config=decision_config,
                    prompt_name=prompt_name,
                )

            cur.execute("SELECT * FROM edge")
            for src_node, dest_node, operator, value in cur.fetchall():
                edges.setdefault(src_node, []).append(
                    Edge(
                        src_node=src_node,
                        dest_node=dest_node,
                        condition=(
                            Condition(operator=operator, value=value)
                            if operator is not None and value is not None
                            else None
                        ),
                    )
                )

        return Graph(entry_node=entry_node, nodes=nodes, edges=edges)

    def compile_graph(self) -> CompiledStateGraph:
        graph = self.get_graph()
        state_graph = StateGraph(State)

        for node in graph.nodes.values():
            state_graph.add_node(node.name, self._node_callback(node=node))

        for node_name in graph.edges:
            state_graph.add_conditional_edges(
                node_name, self._edge_router(graph, node_name)
            )

        state_graph.set_entry_point(graph.entry_node)
        return state_graph.compile()

    def reset_graph(self):
        with conn.cursor() as cur:
            cur.execute("CALL sp_set_default_graph();")

    def _edge_router(self, graph: Graph, node_name: str):
        edges = graph.edges.get(node_name, [])
        node = graph.nodes[node_name]
        output_field = node.output_field if node.agent_type != "responder" else None

        def router(state: State):
            if not output_field:
                return "__end__"

            value = state.get("data", {}).get(output_field)

            for edge in edges:
                if self._eval_condition(edge.condition, value):
                    if state.get("traces"):
                        state["traces"][-1].update(
                            {
                                "next_node": edge.dest_node,
                                "matched_condition": f"{edge.condition.operator} {edge.condition.value}",
                            }
                        )
                    return edge.dest_node

            return "__end__"

        return router

    @staticmethod
    def _eval_condition(condition: Condition, value):
        if condition is None:
            return True

        op = condition.operator
        target = condition.value

        if op == "eq":
            return value == target
        if op == "gt":
            return value > target
        if op == "lt":
            return value < target
        if op == "lte":
            return value <= target
        if op == "gte":
            return value >= target

        return False

    def _node_callback(self, node: AgentNode):
        node_name = node.name
        agent_type = node.agent_type

        def callback(state: State):
            trace = {"agent": node_name, "agent_type": agent_type}

            if agent_type in ["classifier", "gatekeeper", "scorer"]:
                agent_fn = self._agent_registry[agent_type]
                result = agent_fn(
                    state, node.output_field, node.decision_config.model_dump()
                )

                trace.update(
                    {
                        "output_field": node.output_field,
                        "output_value": result["value"],
                        "reason": result["reason"],
                    }
                )

            elif agent_type == "responder":
                prompt = self._prompt_manager.get_formatted_prompt(
                    prompt_name=node.prompt_name,
                    query=state["query"],
                    context=state["context"],
                )
                response = model.invoke(prompt).content

                trace.update({"prompt": prompt, "output": response})

            state.setdefault("traces", []).append(trace)
            return state

        return callback
