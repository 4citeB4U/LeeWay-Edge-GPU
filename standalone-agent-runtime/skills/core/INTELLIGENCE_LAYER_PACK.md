# CORE SYSTEM: EXECUTION INTELLIGENCE

These skills govern HOW the agent system operates, handles failure, and manages complex state.

## SKILLS
### exec.queue.manage
- **Purpose**: Manage multiple concurrent tasks, preventing resource starvation.
- **Workflow**: Receive Request -> Calculate Weight -> Assign Slot -> Monitor Pulse -> Close on Exit.

### exec.retry.strategy
- **Purpose**: Intelligent recovery from failure without infinite loops.
- **Workflow**: Detect Failure -> Categorize Error -> Increment Retry Count -> Apply Exponential Backoff -> Shift to Alternate Adapter.

### exec.state.persist
- **Purpose**: Save the full mental state of a task so it can be resumed after a reboot or failure.
- **Workflow**: Snapshot Memory -> Serialize Call Stack -> Write to Sovereign-Disk -> Verify Integrity.

---

# CORE SYSTEM: DECISION & PRIORITY

### decision.priority.score
- **Purpose**: Score incoming intents based on Urgency (U), Risk (R), and Opportunity (O).
- **Logic**: Score = (U * 0.5) + (R * 0.3) + (O * 0.2).

### decision.conflict.resolve
- **Purpose**: Choose between two competing skills (e.g., "Answer Phone" vs "Process Payment").
- **Logic**: Use the Higher-Tier Policy (Financial > Communication).

---

# CORE SYSTEM: INTELLIGENT MEMORY

### memory.context.build
- **Purpose**: Build a "Working Context Buffer" for the current task by pulling related session history.
- **Workflow**: Query Embeddings -> Filter by Project.Tag -> Rank by Recency -> Format as "Context Plate".

---

# CORE SYSTEM: THE SAFETY GATE

### security.execution_gate
- **Purpose**: Final validation layer before any browser or OS action is committed.
- **Logic**: If Action.Type in Policy.Require_Approval, halt and notify Architect.
