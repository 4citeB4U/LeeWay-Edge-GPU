/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.HIVESTATE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = HiveState module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = src\runtime\consensus\HiveState.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

export interface AgentStatus {
  id: string;
  status: 'IDLE' | 'WORKING' | 'ERROR' | 'OFFLINE';
  lastHeartbeat: number;
}

export interface TaskRecord {
  taskId: string;
  intentId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  result?: any;
}

export interface GlobalContext {
  systemMode: 'SECURE' | 'MAINTENANCE' | 'DEGRADED';
  activeThreatLevel: number;
  environmentVariables: Record<string, string>;
}

export class HiveState {
  private static instance: HiveState;
  
  private globalContext: GlobalContext;
  private taskMaps: Map<string, TaskRecord>;
  private agentStatusMaps: Map<string, AgentStatus>;

  private constructor() {
    this.globalContext = {
      systemMode: 'SECURE',
      activeThreatLevel: 0,
      environmentVariables: {}
    };
    this.taskMaps = new Map();
    this.agentStatusMaps = new Map();
  }

  public static getInstance(): HiveState {
    if (!HiveState.instance) {
      HiveState.instance = new HiveState();
    }
    return HiveState.instance;
  }

  public getGlobalContext(): Readonly<GlobalContext> {
    return Object.freeze({ ...this.globalContext });
  }

  public updateGlobalContext(updates: Partial<GlobalContext>): void {
    this.globalContext = { ...this.globalContext, ...updates };
  }

  public registerTask(task: TaskRecord): void {
    this.taskMaps.set(task.taskId, task);
  }

  public getTask(taskId: string): TaskRecord | undefined {
    return this.taskMaps.get(taskId);
  }

  public updateAgentStatus(agentId: string, status: AgentStatus['status']): void {
    this.agentStatusMaps.set(agentId, {
      id: agentId,
      status,
      lastHeartbeat: Date.now()
    });
  }

  public getAgentStatus(agentId: string): AgentStatus | undefined {
    return this.agentStatusMaps.get(agentId);
  }

  public getSnapshot(): object {
    return {
      globalContext: this.globalContext,
      taskMaps: Array.from(this.taskMaps.entries()),
      agentStatusMaps: Array.from(this.agentStatusMaps.entries()),
    };
  }

  public restoreSnapshot(snapshot: any): void {
    this.globalContext = snapshot.globalContext;
    this.taskMaps = new Map(snapshot.taskMaps);
    this.agentStatusMaps = new Map(snapshot.agentStatusMaps);
  }
}
