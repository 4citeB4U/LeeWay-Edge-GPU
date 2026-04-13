/**
 * LEEWAY IDENTITY + REPUTATION SYSTEM (LIRS)
 * Crypto-based Sovereign Identity and Behavior History tracking.
 */
export class ReputationEngine {
  constructor() {
    this.scores = new Map();
    this.DECAY_FACTOR = 86400000; // 24 hours 
  }

  update(event) {
    let score = this.scores.get(event.actor) || 0;

    if (event.result === "SUCCESS") score += 1;
    if (event.result === "FAILURE") score -= 2;
    if (event.result === "INVALID") score -= 5;

    this.scores.set(event.actor, score);
  }

  get(actor) {
    return this.scores.get(actor) || 0;
  }

  decay(actor, lastActive) {
    const score = this.get(actor);
    const age = Date.now() - lastActive;
    return score * Math.exp(-age / this.DECAY_FACTOR);
  }
}

export class IdentityEngine {
  constructor(reputationEngine) {
    this.identities = new Map();
    this.reputation = reputationEngine;
    this.history = []; // Event History ledger
  }

  async createIdentity(agentName, role, type = "AGENT") {
    const keys = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );
    
    // Hash PublicKey to get structural fingerprint
    const rawPub = await crypto.subtle.exportKey("raw", keys.publicKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', rawPub);
    const fingerprint = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const idObject = {
      id: `${type.toLowerCase()}-${agentName}-${Date.now()}`,
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
      fingerprint,
      role,
      type,
      createdAt: Date.now()
    };
    
    this.identities.set(idObject.id, idObject);
    return idObject;
  }

  logEvent(event) {
    this.history.push({
      ...event,
      eventId: `evt_${Date.now()}_${Math.random()}`,
      timestamp: Date.now()
    });
    this.reputation.update(event);
    
    // Check malicious thresholds
    const val = this.reputation.get(event.actor);
    if (val < -50) {
      console.warn(`[LIRS WARNING] Auto-Blacklisting malicious identity: ${event.actor}`);
      this.identities.delete(event.actor);
    }
  }

  canExecute(actor, task) {
    const rep = this.reputation.get(actor);
    if (task.type === "CRITICAL" && rep < 50) return false;
    if (task.type === "NORMAL" && rep < 0) return false;
    return true;
  }
}
