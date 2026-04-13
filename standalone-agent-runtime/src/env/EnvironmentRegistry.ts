/*
LEEWAY HEADER — DO NOT REMOVE
REGION: ENVIRONMENT
TAG: CORE.ENV.REGISTRY
5WH:
  WHAT = Plugin-based environment detection system
  WHY = Replaces hardcoded strings with a registry of verification functions
  WHO = LeeWay Innovations
*/

type EnvCheck = () => Promise<boolean>;

export class EnvironmentRegistry {
  private checks = new Map<string, EnvCheck>();

  constructor() {
    // Register defaults
    this.register("network.online", async () => navigator ? navigator.onLine : true);
  }

  register(key: string, fn: EnvCheck) {
    this.checks.set(key, fn);
  }

  async has(key: string): Promise<boolean> {
    const fn = this.checks.get(key);
    if (!fn) {
      console.warn(`⚠️ ENV_REGISTRY: No check registered for key [${key}]`);
      return false;
    }
    return await fn();
  }
}
