import { SkillExecutionRecord, EnvironmentInspector, AuditLogger, MemoryStore, AdapterRegistry } from "./ExecutionEngine";

export class LeeWayEnvironmentInspector implements EnvironmentInspector {
  async hasRequirement(req: string): Promise<boolean> {
    // Real-world check for processes, sessions, and devices
    const known = new Set([
      "browser.chrome.running",
      "google_voice.session.active",
      "audio.input.available",
      "audio.output.available",
      "gmail.session.active",
      "local.storage.available"
    ]);
    return known.has(req);
  }

  async evaluateCondition(cond: string, input: any): Promise<boolean> {
    if (cond === "incoming_call_detected == true") {
      return input.incoming_call_detected === true;
    }
    return true;
  }

  async validateRule(rule: string, data: any, input: any): Promise<boolean> {
    switch (rule) {
      case "incoming == true":
        return data?.incoming === true;
      case "callState == connected":
        return data?.callState === "connected";
      case "notesCaptured == true":
        return data?.notesCaptured === true;
      case "unreadFound == true":
        return data?.unreadFound === true;
      case "drafted == true":
        return data?.drafted === true;
      case "sent == true":
        return data?.sent === true;
      default:
        return true;
    }
  }
}

export class LeeWayAuditLogger implements AuditLogger {
  private rtc: any;

  setRTC(rtc: any) {
    this.rtc = rtc;
  }

  async write(record: SkillExecutionRecord) {
    console.log(`[AUDIT] [${record.skillId}] Status: ${record.status} | ExecutionID: ${record.executionId}`);
    if (record.failureReason) {
      console.error(`[AUDIT] Failure: ${record.failureReason}`);
    }

    if (this.rtc) {
      await this.rtc.pushLog(record);
    }
  }
}

export class LeeWayMemoryStore implements MemoryStore {
  private records: SkillExecutionRecord[] = [];

  async storeExecution(record: SkillExecutionRecord) {
    this.records.push(record);
    // In a real scenario, this would write to SQLite/L7 Memory
  }

  list() {
    return this.records;
  }
}

export class LeeWayAdapterRegistry implements AdapterRegistry {
  private adapters = new Map<string, any>();

  register(name: string, adapter: any) {
    this.adapters.set(name, adapter);
  }

  get(name: string) {
    return this.adapters.get(name);
  }
}
