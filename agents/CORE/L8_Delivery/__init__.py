/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.__INIT__.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = __init__ module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = agents\CORE\L8_Delivery\__init__.py
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

"""
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.L8
TAG: LEEWAY.CORE.__INIT___PY

5WH:
WHAT = Core High-Level Agent component in the Sovereign Spine
WHY = Powers the Delivery capabilities of the LeeWay ecosystem
WHO = LeeWay Innovations (By Leonard Jerome Lee)
WHERE = agents/CORE/L8_Delivery/__init__.py
WHEN = 2026
HOW = LeeWay-governed autonomous subsystem operation

LICENSE:
MIT
"""
"""
Cerebral Agent Registry
========================
Four sovereign agents, each with a declared tool manifest.

Import pattern:
    from agents import SentinelAgent, NavigatorAgent, CodeScoutAgent, ArchivistAgent
    result = SentinelAgent().run("health_snapshot", {})
"""

from agents.sentinel_agent  import SentinelAgent
from agents.navigator_agent import NavigatorAgent
from agents.code_scout_agent import CodeScoutAgent
from agents.archivist_agent  import ArchivistAgent

AGENT_REGISTRY = {
    "sentinel":  SentinelAgent,
    "navigator": NavigatorAgent,
    "code_scout": CodeScoutAgent,
    "archivist": ArchivistAgent,
}

def get_agent(name: str):
    cls = AGENT_REGISTRY.get(name)
    if cls is None:
        raise ValueError(f"Unknown agent: {name!r}. Available: {list(AGENT_REGISTRY)}")
    return cls()

__all__ = ["SentinelAgent", "NavigatorAgent", "CodeScoutAgent", "ArchivistAgent",
           "AGENT_REGISTRY", "get_agent"]
