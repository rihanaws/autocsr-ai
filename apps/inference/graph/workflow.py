from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from .router import classify
from .agents.deposit import deposit_agent


class WorkflowState(TypedDict):
    query: str
    tenant_id: str
    session_id: Optional[str]
    agent_type: str
    confidence: float
    response: str
    cache_hit: bool
    flagged: bool
    resolution_ms: int


def route_node(state: WorkflowState) -> WorkflowState:
    agent_type, confidence = classify(state["query"])
    return {**state, "agent_type": agent_type, "confidence": confidence}


def dispatch(state: WorkflowState) -> str:
    return state["agent_type"]


def deposit_node(state: WorkflowState) -> WorkflowState:
    result = deposit_agent(state["query"], state["tenant_id"])
    return {**state, **result}


def general_node(state: WorkflowState) -> WorkflowState:
    return {
        **state,
        "response": "I can help with that. Please provide more details.",
        "flagged": False,
    }


def build_graph() -> StateGraph:
    graph = StateGraph(WorkflowState)

    graph.add_node("router", route_node)
    graph.add_node("DEPOSIT", deposit_node)
    graph.add_node("WITHDRAWAL", general_node)
    graph.add_node("VERIFICATION", general_node)
    graph.add_node("ONBOARDING", general_node)
    graph.add_node("GENERAL", general_node)

    graph.set_entry_point("router")

    graph.add_conditional_edges(
        "router",
        dispatch,
        {
            "DEPOSIT": "DEPOSIT",
            "WITHDRAWAL": "WITHDRAWAL",
            "VERIFICATION": "VERIFICATION",
            "ONBOARDING": "ONBOARDING",
            "GENERAL": "GENERAL",
        },
    )

    for node in ("DEPOSIT", "WITHDRAWAL", "VERIFICATION", "ONBOARDING", "GENERAL"):
        graph.add_edge(node, END)

    return graph.compile()


workflow = build_graph()
