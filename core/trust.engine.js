/**
 * LEEWAY CONSENSUS + TRUST LAYER (LCTL)
 * Decentralized trust and decision system
 */
export class TrustEngine {
  constructor() {
    this.trusted = new Map();
  }

  async generateIdentity(nodeId) {
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );
    return {
      nodeId,
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey
    };
  }

  addTrustedNode(nodeId, publicKey, role = "WORKER") {
    this.trusted.set(nodeId, { publicKey, role, invalidSignatures: 0 });
  }

  isTrusted(nodeId) {
    return this.trusted.has(nodeId);
  }

  async signMessage(privateKey, data) {
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const signature = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      privateKey,
      encoded
    );
    // Base64 encode for transport
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  async verifyMessage(publicKey, data, signatureBase64) {
    const signature = new Uint8Array(atob(signatureBase64).split('').map(char => char.charCodeAt(0)));
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    return await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      signature,
      encoded
    );
  }

  consensusApprove(votes) {
    const approvals = votes.filter(v => v === "YES").length;
    return approvals >= Math.ceil(votes.length / 2);
  }

  validatePayloadHash(payload, providedHash) {
    // Requires an async subtle crypto digest in real implementation
    // Mocking for structural layout
    return true; 
  }
}
