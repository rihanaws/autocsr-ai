from typing import Optional, TypedDict

from langgraph.graph import END, StateGraph

from .agents.deposit import deposit_agent
from .agents.general import general_agent
from .agents.onboarding import onboarding_agent
from .agents.verification import verification_agent
from .agents.withdrawal import withdrawal_agent
from .router import classify


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
    # Confidence < 0.7 already handled in router.classify — always returns GENERAL
    return state["agent_type"]


def deposit_node(state: WorkflowState) -> WorkflowState:
    result = deposit_agent(state["query"], state["tenant_id"])
    return {**state, **result}


def withdrawal_node(state: WorkflowState) -> WorkflowState:
    result = withdrawal_agent(state["query"], state["tenant_id"])
    return {**state, **result}


def verification_node(state: WorkflowState) -> WorkflowState:
    result = verification_agent(state["query"], state["tenant_id"])
    return {**state, **result}


def onboarding_node(state: WorkflowState) -> WorkflowState:
    result = onboarding_agent(state["query"], state["tenant_id"])
    return {**state, **result}


def general_node(state: WorkflowState) -> WorkflowState:
    result = general_agent(state["query"], state["tenant_id"])
    return {**state, **result}


def build_graph() -> StateGraph:
    graph = StateGraph(WorkflowState)

    graph.add_node("router", route_node)
    graph.add_node("DEPOSIT", deposit_node)
    graph.add_node("WITHDRAWAL", withdrawal_node)
    graph.add_node("VERIFICATION", verification_node)
    graph.add_node("ONBOARDING", onboarding_node)
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
