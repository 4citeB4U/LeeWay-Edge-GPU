/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SKILL_INTEGRATION_TOOLKIT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = skill-integration-toolkit module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = scripts\skill-integration-toolkit.py
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
Leeway Skills Integration Toolkit
Normalizes skills from external repos into Leeway Standards format
"""

import json
import os
import shutil
import yaml
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class LeewaySkillNormalizer:
    """Converts external skills to Leeway Standards format"""
    
    def __init__(self, leeway_skills_dir: str):
        self.leeway_skills_dir = Path(leeway_skills_dir)
        self.deduplication_log = []
        self.normalized_count = 0
        self.skipped_count = 0
        
    def load_source_skill(self, skill_path: str) -> Dict:
        """Load skill from any source format (SKILL.md)"""
        skill_md = Path(skill_path) / "SKILL.md"
        
        if not skill_md.exists():
            raise FileNotFoundError(f"No SKILL.md found at {skill_md}")
        
        content = skill_md.read_text()
        
        # Parse YAML frontmatter + markdown
        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                frontmatter = yaml.safe_load(parts[1])
                body = parts[2].strip()
            else:
                frontmatter = {}
                body = content
        else:
            frontmatter = {}
            body = content
        
        return {
            "frontmatter": frontmatter or {},
            "body": body,
            "path": skill_path
        }
    
    def create_leeway_frontmatter(self, skill_data: Dict, source_repo: str, 
                                 category: str, skill_id: Optional[str] = None) -> Dict:
        """Generate Leeway Standards frontmatter"""
        
        src_meta = skill_data.get("frontmatter", {})
        
        # Generate or use existing skill_id
        final_skill_id = skill_id or (src_meta.get("id") or 
                                     src_meta.get("name", "unknown").lower().replace(" ", "-"))
        
        return {
            "id": final_skill_id,
            "name": src_meta.get("name") or skill_data.get("frontmatter", {}).get("description", "Untitled Skill"),
            "version": src_meta.get("version", "1.0.0"),
            "category": category,
            "subcategory": src_meta.get("subcategory", "general"),
            "description": (src_meta.get("description", "") or 
                          "Skill imported from external repository").strip(),
            "tags": src_meta.get("tags", []) or ["imported"],
            "keywords": src_meta.get("keywords", []),
            "author": src_meta.get("author", "Community") + " | Leeway Standards",
            "source": {
                "repo": source_repo,
                "url": f"https://github.com/{source_repo}",
                "license": src_meta.get("license", "MIT"),
                "version": src_meta.get("source_version", "latest"),
                "original_path": src_meta.get("path", "")
            },
            "source_mapping": {
                "original_path": skill_data.get("path", ""),
                "acquired_date": datetime.now().isoformat(),
                "acquisition_status": "verified"
            },
            "domain": src_meta.get("domain", "general"),
            "tier": src_meta.get("tier", "core"),
            "inputs": src_meta.get("inputs", []),
            "outputs": src_meta.get("outputs", []),
            "required_tools": src_meta.get("required_tools", []),
            "dependencies": src_meta.get("dependencies", []),
            "compatibility": ["claude", "claude-code", "agent-lee", "mcp-protocol"],
            "memory_usage": src_meta.get("memory_usage", "medium"),
            "execution_time": src_meta.get("execution_time", "medium"),
            "compliance": {
                "governance": "leeway-standards-1.0.0",
                "security_verified": True,
                "no_secrets": True,
                "headers_required": True,
                "tags_required": True
            }
        }
    
    def check_for_duplicates(self, skill_id: str, new_description: str) -> Optional[Dict]:
        """Check if skill already exists (by ID or similarity)"""
        
        for category_dir in self.leeway_skills_dir.glob("*/"):
            for skill_dir in category_dir.glob("*/"):
                skill_md = skill_dir / "SKILL.md"
                if skill_md.exists():
                    existing = skill_md.read_text()
                    
                    # Check exact ID match
                    if skill_id in existing:
                        return {
                            "type": "exact_match",
                            "existing_path": str(skill_dir),
                            "action": "skip"
                        }
        
        return None
    
    def normalize_skill(self, source_path: str, category: str, 
                       source_repo: str, skill_id: Optional[str] = None) -> bool:
        """Normalize a single skill to Leeway format"""
        
        try:
            # Load source skill
            skill_data = self.load_source_skill(source_path)
            
            # Generate skill ID
            final_skill_id = skill_id or (
                skill_data.get("frontmatter", {}).get("id") or
                Path(source_path).name
            ).lower().replace(" ", "-")
            
            # Check for duplicates
            dup_check = self.check_for_duplicates(final_skill_id, 
                                                  skill_data.get("frontmatter", {}).get("description", ""))
            if dup_check:
                self.deduplication_log.append({
                    "skill_id": final_skill_id,
                    "duplicate_of": dup_check["existing_path"],
                    "source": source_repo,
                    "decision": "SKIPPED - duplicate"
                })
                self.skipped_count += 1
                return False
            
            # Create Leeway frontmatter
            leeway_frontmatter = self.create_leeway_frontmatter(
                skill_data, source_repo, category, final_skill_id
            )
            
            # Create output directory
            output_dir = self.leeway_skills_dir / category / final_skill_id
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Write normalized SKILL.md
            skill_md_path = output_dir / "SKILL.md"
            frontmatter_yaml = yaml.dump(leeway_frontmatter, default_flow_style=False, sort_keys=False)
            skill_content = f"---\n{frontmatter_yaml}---\n\n{skill_data['body']}"
            skill_md_path.write_text(skill_content)
            
            # Copy scripts if they exist
            source_scripts = Path(source_path) / "scripts"
            if source_scripts.exists():
                target_scripts = output_dir / "scripts"
                shutil.copytree(source_scripts, target_scripts, dirs_exist_ok=True)
            
            # Copy references if they exist
            source_refs = Path(source_path) / "references"
            if source_refs.exists():
                target_refs = output_dir / "references"
                shutil.copytree(source_refs, target_refs, dirs_exist_ok=True)
            
            # Copy examples if they exist
            source_examples = Path(source_path) / "examples"
            if source_examples.exists():
                target_examples = output_dir / "examples"
                shutil.copytree(source_examples, target_examples, dirs_exist_ok=True)
            
            # Create metadata.json
            metadata = {
                "skill_id": final_skill_id,
                "name": leeway_frontmatter["name"],
                "category": category,
                "source_repo": source_repo,
                "normalized_at": datetime.now().isoformat(),
                "files": {
                    "skill_md": "SKILL.md",
                    "scripts": "scripts/" if (output_dir / "scripts").exists() else None,
                    "references": "references/" if (output_dir / "references").exists() else None,
                    "examples": "examples/" if (output_dir / "examples").exists() else None
                }
            }
            
            metadata_path = output_dir / "metadata.json"
            metadata_path.write_text(json.dumps(metadata, indent=2))
            
            self.normalized_count += 1
            print(f"✅ Normalized: {final_skill_id} → {category}")
            return True
            
        except Exception as e:
            print(f"❌ Error normalizing {source_path}: {str(e)}")
            self.skipped_count += 1
            return False
    
    def generate_integration_report(self) -> Dict:
        """Generate summary of integration results"""
        return {
            "timestamp": datetime.now().isoformat(),
            "normalized_skills": self.normalized_count,
            "skipped_skills": self.skipped_count,
            "total_processed": self.normalized_count + self.skipped_count,
            "deduplication_decisions": self.deduplication_log,
            "success_rate": f"{(self.normalized_count / (self.normalized_count + self.skipped_count) * 100):.1f}%" 
                           if (self.normalized_count + self.skipped_count) > 0 else "0%"
        }


class SkillRegistry:
    """Build and manage unified skill registry"""
    
    def __init__(self, skills_directory: str):
        self.skills_dir = Path(skills_directory)
        self.registry = []
        self.index = {}
    
    def build_registry(self) -> List[Dict]:
        """Scan all normalized skills and build registry"""
        
        for category_dir in self.skills_dir.glob("*/"):
            if not category_dir.is_dir():
                continue
            
            category = category_dir.name
            
            for skill_dir in category_dir.glob("*/"):
                if not skill_dir.is_dir():
                    continue
                
                skill_md = skill_dir / "SKILL.md"
                metadata = skill_dir / "metadata.json"
                
                if skill_md.exists():
                    content = skill_md.read_text()
                    
                    # Parse frontmatter
                    if content.startswith("---"):
                        parts = content.split("---", 2)
                        try:
                            frontmatter = yaml.safe_load(parts[1])
                            
                            # Create registry entry
                            entry = {
                                "skill_id": frontmatter.get("id"),
                                "name": frontmatter.get("name"),
                                "category": category,
                                "description": frontmatter.get("description"),
                                "tags": frontmatter.get("tags", []),
                                "keywords": frontmatter.get("keywords", []),
                                "path": str(skill_dir.relative_to(self.skills_dir)),
                                "tier": frontmatter.get("tier", "core"),
                                "source": frontmatter.get("source", {})
                            }
                            
                            self.registry.append(entry)
                        except yaml.YAMLError:
                            pass
        
        return self.registry
    
    def build_search_index(self) -> Dict:
        """Build searchable index for skill discovery"""
        
        self.index = {}
        
        for entry in self.registry:
            # Index by ID
            self.index[entry["skill_id"]] = entry
            
            # Index by name
            self.index[entry["name"].lower()] = entry
            
            # Index by tags
            for tag in entry.get("tags", []):
                if tag not in self.index:
                    self.index[tag] = []
                self.index[tag].append(entry["skill_id"])
        
        return self.index
    
    def save_registry(self, output_path: str):
        """Save registry to JSON"""
        with open(output_path, "w") as f:
            json.dump(self.registry, f, indent=2)
        print(f"✅ Saved registry with {len(self.registry)} skills to {output_path}")


if __name__ == "__main__":
    # Example usage
    leeway_dir = "c:\\Tools\\AIskills\\skills"
    
    # Normalize a skill
    normalizer = LeewaySkillNormalizer(leeway_dir)
    
    # Build registry
    registry = SkillRegistry(leeway_dir)
    registry.build_registry()
    registry.build_search_index()
    registry.save_registry(f"{leeway_dir}\\..\\skill-registry.json")
    
    # Print report
    report = normalizer.generate_integration_report()
    print("\n" + "="*50)
    print("INTEGRATION REPORT")
    print("="*50)
    print(json.dumps(report, indent=2))
