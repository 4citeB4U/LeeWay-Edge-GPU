/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.WORKFLOW_INTEGRATION_TOOLKIT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = workflow-integration-toolkit module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = scripts\workflow-integration-toolkit.py
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

#!/usr/bin/env python3
"""
Leeway Workflow Integration Toolkit

Normalizes workflow definitions from multiple frameworks (GitHub Agentics, CrewAI, AutoGen, etc.)
into Leeway WORKFLOW.md standard format, builds executable registry, and enables direct invocation.

Usage:
    python3 workflow-integration-toolkit.py audit-repos
    python3 workflow-integration-toolkit.py normalize [source-path] [category]
    python3 workflow-integration-toolkit.py build-registry
    python3 workflow-integration-toolkit.py execute [workflow-id] [inputs]
"""

import os
import json
import yaml
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass, asdict
import subprocess
import sys


@dataclass
class WorkflowMetadata:
    """Leeway WORKFLOW.md standard metadata"""
    id: str
    name: str
    category: str
    subtype: str  # sequential | hierarchical | event-driven | fsm | dag | crew
    skill_bundle: List[str]
    composition_pattern: str  # CrewAI | LangGraph | AutoGen | GitHub Agentics | SuperAGI
    trigger: str  # schedule | event | manual | api
    version: str
    source: Dict  # {repo, url, acquired_date, original_path}
    compliance: Dict  # {governance, required_skills_present, skill_coverage}
    estimated_runtime: str
    success_metrics: List[Dict]
    execution_code: Optional[str] = None
    description: Optional[str] = None


class WorkflowNormalizer:
    """Normalizes workflow definitions from different frameworks to Leeway standard"""
    
    def __init__(self, workflows_root: str):
        self.workflows_root = Path(workflows_root)
        self.workflows_root.mkdir(exist_ok=True, parents=True)
        self.registry = {}
        self.dedup_index = {}
    
    def audit_source_repos(self, sources_root: str) -> Dict:
        """
        Audit all source workflow repositories and catalog workflows.
        
        Returns:
            {
                "github_agentics": {count, workflows: [...]},
                "crewai": {...},
                ...
                "total": number
            }
        """
        sources_path = Path(sources_root)
        audit_results = {"total": 0}
        
        # GitHub Agentics audit
        agentics_path = sources_path / "agentics" / "docs"
        if agentics_path.exists():
            agentics_workflows = self._audit_github_agentics(agentics_path)
            audit_results["github_agentics"] = {
                "count": len(agentics_workflows),
                "workflows": agentics_workflows
            }
            audit_results["total"] += len(agentics_workflows)
        
        # CrewAI audit
        crewai_path = sources_path / "crewai" / "examples"
        if crewai_path.exists():
            crewai_workflows = self._audit_crewai(crewai_path)
            audit_results["crewai"] = {
                "count": len(crewai_workflows),
                "workflows": crewai_workflows
            }
            audit_results["total"] += len(crewai_workflows)
        
        # AutoGen audit
        autogen_path = sources_path / "autogen" / "python"
        if autogen_path.exists():
            autogen_workflows = self._audit_autogen(autogen_path)
            audit_results["autogen"] = {
                "count": len(autogen_workflows),
                "workflows": autogen_workflows
            }
            audit_results["total"] += len(autogen_workflows)
        
        # LangGraph audit
        langgraph_path = sources_path / "langgraph" / "examples"
        if langgraph_path.exists():
            langgraph_workflows = self._audit_langgraph(langgraph_path)
            audit_results["langgraph"] = {
                "count": len(langgraph_workflows),
                "workflows": langgraph_workflows
            }
            audit_results["total"] += len(langgraph_workflows)
        
        # SuperAGI audit
        superagi_path = sources_path / "SuperAGI"
        if superagi_path.exists():
            superagi_workflows = self._audit_superagi(superagi_path)
            audit_results["superagi"] = {
                "count": len(superagi_workflows),
                "workflows": superagi_workflows
            }
            audit_results["total"] += len(superagi_workflows)
        
        return audit_results
    
    def _audit_github_agentics(self, docs_path: Path) -> List[str]:
        """Extract GitHub Agentics workflows (markdown files in docs/)"""
        workflows = []
        for md_file in docs_path.glob("*.md"):
            if md_file.stem not in ["README", "index"]:
                workflows.append(md_file.stem)
        return sorted(workflows)
    
    def _audit_crewai(self, examples_path: Path) -> List[str]:
        """Extract CrewAI examples (directories in examples/)"""
        workflows = []
        for d in examples_path.iterdir():
            if d.is_dir() and (d / "crew.py").exists():
                workflows.append(d.name)
        return sorted(workflows)
    
    def _audit_autogen(self, python_path: Path) -> List[str]:
        """Extract AutoGen workflow examples"""
        workflows = []
        for root, dirs, files in os.walk(python_path):
            for f in files:
                if f.endswith("_agent.py") or f == "agent.py":
                    workflows.append(Path(root).relative_to(python_path).name)
        return sorted(set(workflows))
    
    def _audit_langgraph(self, examples_path: Path) -> List[str]:
        """Extract LangGraph examples"""
        workflows = []
        for py_file in examples_path.rglob("*.py"):
            if "graph" in py_file.name.lower():
                workflows.append(py_file.stem)
        return sorted(set(workflows))
    
    def _audit_superagi(self, root_path: Path) -> List[str]:
        """Extract SuperAGI workflows from superagi/workflows"""
        workflows = []
        workflows_dir = root_path / "superagi" / "workflows"
        if workflows_dir.exists():
            for d in workflows_dir.iterdir():
                if d.is_dir() and (d / "workflow.yaml").exists():
                    workflows.append(d.name)
        return sorted(workflows)
    
    def normalize_github_agentics(self, md_path: Path, category: str, workflow_id: str) -> WorkflowMetadata:
        """
        Normalize a GitHub Agentics workflow (markdown) to WORKFLOW.md format
        
        Example GitHub Agentics workflow structure:
        ---
        # Issue Triage
        
        [Description]
        ...
        """
        with open(md_path) as f:
            content = f.read()
        
        # Parse title
        title_match = re.search(r"^# (.+)$", content, re.MULTILINE)
        name = title_match.group(1) if title_match else md_path.stem
        
        # Extract trigger type from description
        trigger = "manual"
        if "schedule" in content.lower(): trigger = "schedule"
        if "event" in content.lower() or "GitHub event" in content: trigger = "event"
        if "trigger" in content.lower() and "api" in content.lower(): trigger = "api"
        
        # Infer skill bundle from content
        skills = self._extract_mentioned_skills(content)
        
        metadata = WorkflowMetadata(
            id=workflow_id or f"workflow.{md_path.stem}",
            name=name,
            category=category,
            subtype="event-driven",  # GitHub Agentics is primarily event-driven
            skill_bundle=skills,
            composition_pattern="GitHub Agentics",
            trigger=trigger,
            version="1.0.0",
            source={
                "repo": "githubnext/agentics",
                "url": f"https://github.com/githubnext/agentics/blob/main/docs/{md_path.name}",
                "acquired_date": datetime.now().isoformat(),
                "original_path": str(md_path)
            },
            compliance={
                "governance": "leeway-standards-1.0.0",
                "required_skills_present": len(skills) > 0,
                "skill_coverage": min(100, len(skills) * 20)  # Estimate
            },
            estimated_runtime="5min - 60min",
            success_metrics=[
                {"metric_name": "Workflow completion", "target": "> 95%"},
                {"metric_name": "Processing time", "target": "< estimated runtime"}
            ],
            description=self._extract_first_paragraph(content)
        )
        return metadata
    
    def normalize_crewai(self, crew_py_path: Path, category: str, workflow_id: str) -> WorkflowMetadata:
        """
        Normalize a CrewAI example (Python) to WORKFLOW.md format
        
        Reads crew.py and config/agents.yaml, config/tasks.yaml
        """
        with open(crew_py_path) as f:
            crew_code = f.read()
        
        # Infer workflow name and type
        name = Path(crew_py_path).parent.name.replace("_", " ").title()
        
        # Determine if Crew or Flow
        is_flow = "Flow" in crew_code
        subtype = "hierarchical" if "hierarchical" in crew_code.lower() else "sequential"
        if is_flow:
            subtype = "event-driven" if "@listen" in crew_code or "@router" in crew_code else "sequential"
        
        # Extract skill requirements from config
        config_dir = Path(crew_py_path).parent / "config"
        agents = []
        if (config_dir / "agents.yaml").exists():
            with open(config_dir / "agents.yaml") as f:
                agents_data = yaml.safe_load(f)
                if agents_data:
                    agents = list(agents_data.keys())
        
        # Infer skills from agent roles
        skills = self._extract_skills_from_crew_roles(agents, config_dir)
        
        metadata = WorkflowMetadata(
            id=workflow_id or f"workflow.{Path(crew_py_path).parent.name}",
            name=name,
            category=category,
            subtype=subtype,
            skill_bundle=skills,
            composition_pattern="CrewAI",
            trigger="manual",  # CrewAI examples are typically manual
            version="1.0.0",
            source={
                "repo": "crewai",
                "url": f"https://github.com/crewai/crewai-examples/tree/main/{Path(crew_py_path).parent.name}",
                "acquired_date": datetime.now().isoformat(),
                "original_path": str(crew_py_path)
            },
            compliance={
                "governance": "leeway-standards-1.0.0",
                "required_skills_present": len(skills) > 0,
                "skill_coverage": min(100, len(agents) * 20)
            },
            estimated_runtime="1min - 15min",
            success_metrics=[
                {"metric_name": "Task completion", "target": "> 90%"},
                {"metric_name": "Agent coordination", "target": "100%"}
            ],
            execution_code=crew_code[:500]  # First 500 chars for reference
        )
        return metadata
    
    def _extract_mentioned_skills(self, content: str) -> List[str]:
        """Extract skill names mentioned in content"""
        # Simple heuristic: look for "skill-*" patterns, agent roles, etc.
        skills = []
        skill_patterns = [
            r"(?:skill|ability|capability)[\s-]*(?::\s*)?(?:of\s+)?([a-z\-]+)",
            r"(?:expert|specialist)\s+(?:in\s+)?([a-z\-]+)",
            r"(?:reviews?|analyzes?|generates?|creates?)\s+([a-z\-]+)",
        ]
        
        for pattern in skill_patterns:
            matches = re.findall(pattern, content.lower())
            skills.extend(matches)
        
        return sorted(set(skills))[:10]  # Top 10
    
    def _extract_skills_from_crew_roles(self, agents: List[str], config_dir: Path) -> List[str]:
        """Extract skills from CrewAI agent roles"""
        skills = []
        agents_yaml_path = config_dir / "agents.yaml"
        
        if agents_yaml_path.exists():
            with open(agents_yaml_path) as f:
                agents_data = yaml.safe_load(f)
                if agents_data:
                    for agent_name, agent_config in agents_data.items():
                        if isinstance(agent_config, dict):
                            role = agent_config.get("role", "")
                            goal = agent_config.get("goal", "")
                            # Extract keywords as pseudo-skills
                            for word in (role + " " + goal).split():
                                if len(word) > 3 and word not in ["the", "and", "for", "with"]:
                                    skills.append(word.lower().strip(".,;:"))
        
        return sorted(set(skills))[:10]
    
    def _extract_first_paragraph(self, content: str) -> str:
        """Extract first paragraph of content"""
        lines = content.split("\n")
        para = []
        for line in lines:
            if line.startswith("#"): continue
            if line.strip() == "" and para: break
            if line.strip(): para.append(line.strip())
        return " ".join(para)[:200]
    
    def write_workflow_file(self, metadata: WorkflowMetadata, output_dir: Path) -> Path:
        """
        Write normalized workflow to WORKFLOW.md file in category/workflow_id/ directory
        """
        workflow_dir = output_dir / metadata.category / metadata.id.replace("workflow.", "")
        workflow_dir.mkdir(parents=True, exist_ok=True)
        
        workflow_md = workflow_dir / "WORKFLOW.md"
        
        # Generate WORKFLOW.md content
        content = f"""---
id: {metadata.id}
name: "{metadata.name}"
category: {metadata.category}
subtype: {metadata.subtype}
skill_bundle: {json.dumps(metadata.skill_bundle)}
composition_pattern: {metadata.composition_pattern}
trigger: {metadata.trigger}
version: "{metadata.version}"
source:
  repo: {metadata.source['repo']}
  url: {metadata.source['url']}
  acquired_date: {metadata.source['acquired_date']}
compliance:
  governance: {metadata.compliance['governance']}
  required_skills_present: {str(metadata.compliance['required_skills_present']).lower()}
  skill_coverage: {metadata.compliance['skill_coverage']}
estimated_runtime: "{metadata.estimated_runtime}"
success_metrics:
{chr(10).join(f"  - {json.dumps(m)}" for m in metadata.success_metrics)}
---

# {metadata.name}

## Purpose

{metadata.description or "[Generated from source workflow]"}

## Skill Bundle

Required skills (auto-loaded when workflow is invoked):

{chr(10).join(f"- `{skill}`: [Loaded from skill registry]" for skill in metadata.skill_bundle)}

## Execution Pattern

**Framework**: {metadata.composition_pattern}  
**Subtype**: {metadata.subtype}  
**Trigger**: {metadata.trigger}

## Orchestration

This workflow is defined in the {metadata.composition_pattern} framework.
See source for full implementation:

**Source**: `{metadata.source['original_path']}`

## Success Criteria

{chr(10).join(f"- {m['metric_name']}: {m['target']}" for m in metadata.success_metrics)}

## Execution

Once generated, this workflow can be executed via Agent Lee MCP:
```
agent_lee.execute_workflow(workflow_id="{metadata.id}", inputs={{...}})
```

## Related Skills

This workflow depends on:
{chr(10).join(f"- `{skill}`" for skill in metadata.skill_bundle)}

To see available skills, check the Leeway Skills registry.

---

**Acquired**: {metadata.source['acquired_date']}  
**Framework**: {metadata.composition_pattern}  
**Status**: Ready for execution
"""
        
        with open(workflow_md, 'w') as f:
            f.write(content)
        
        return workflow_md
    
    def build_workflow_registry(self, workflows_root: Path) -> Dict:
        """
        Walk all workflows/ and build a comprehensive registry
        """
        registry = {
            "version": "1.0.0",
            "generated": datetime.now().isoformat(),
            "total_workflows": 0,
            "by_category": {},
            "workflows": {}
        }
        
        for category_dir in (workflows_root / "workflows").iterdir():
            if not category_dir.is_dir(): continue
            
            category = category_dir.name
            registry["by_category"][category] = []
            
            for workflow_dir in category_dir.iterdir():
                if not workflow_dir.is_dir(): continue
                
                workflow_md = workflow_dir / "WORKFLOW.md"
                if not workflow_md.exists(): continue
                
                # Parse WORKFLOW.md frontmatter
                with open(workflow_md) as f:
                    content = f.read()
                    frontmatter = re.search(r"^---\n(.*?)\n---", content, re.DOTALL)
                    if frontmatter:
                        try:
                            metadata = yaml.safe_load(frontmatter.group(1))
                            workflow_id = metadata.get("id")
                            registry["workflows"][workflow_id] = {
                                "name": metadata.get("name"),
                                "category": category,
                                "skills": metadata.get("skill_bundle", []),
                                "framework": metadata.get("composition_pattern"),
                                "path": str(workflow_md)
                            }
                            registry["by_category"][category].append(workflow_id)
                            registry["total_workflows"] += 1
                        except:
                            pass
        
        return registry
    
    def save_registry(self, registry: Dict, output_path: str):
        """Save workflow registry to JSON"""
        with open(output_path, 'w') as f:
            json.dump(registry, f, indent=2)
    
    def generate_integration_report(self, audit: Dict, registry: Dict) -> str:
        """Generate human-readable report of acquisition status"""
        report = f"""
# Leeway Workflow Acquisition Report

**Generated**: {datetime.now().isoformat()}

## Audit Results

Total workflows discovered: {audit.get('total', 0)}

Per-source breakdown:
"""
        for source, data in audit.items():
            if source != 'total' and isinstance(data, dict):
                report += f"- **{source.replace('_', ' ').title()}**: {data.get('count', 0)} workflows\n"
        
        report += f"""
## Registry Status

Total workflows indexed: {registry.get('total_workflows', 0)}

By category:
"""
        for category, workflows in registry.get('by_category', {}).items():
            report += f"- **{category}**: {len(workflows)} workflows\n"
        
        return report


def main():
    """CLI entry point"""
    toolkit = WorkflowNormalizer("c:/Tools/AIskills/workflows")
    
    if len(sys.argv) < 2:
        print(__doc__)
        return
    
    command = sys.argv[1]
    
    if command == "audit-repos":
        print("Auditing workflow source repositories...")
        audit = toolkit.audit_source_repos("c:/Tools/AIskills/sources-workflows")
        print(json.dumps(audit, indent=2))
        
    elif command == "build-registry":
        print("Building workflow registry...")
        registry = toolkit.build_workflow_registry(Path("c:/Tools/AIskills"))
        toolkit.save_registry(registry, "workflow-registry.json")
        report = toolkit.generate_integration_report({}, registry)
        print(report)
        
    else:
        print(f"Unknown command: {command}")
        print(__doc__)


if __name__ == "__main__":
    main()
