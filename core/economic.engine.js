/**
 * LEEWAY ECONOMIC LAYER (LEEL)
 * Resource valuation, incentive, and sustainability infrastructure
 */
export class EconomicEngine {
  constructor() {
    this.wallets = new Map();
  }

  createWallet(identityId, initialBalance = 1000) {
    this.wallets.set(identityId, {
      id: identityId,
      balance: initialBalance,
      earnings: 0,
      spending: 0
    });
  }

  calculateCost(task) {
    return (task.computeCost || 0) + (task.memoryCost || 0) + (task.timeCost || 0);
  }

  dynamicPrice(node) {
    const cap = node.capacity || 100;
    const load = node.currentLoad || 0;
    return 1 + (load / cap);
  }

  chargeAgent(agentId, taskCost) {
    const wallet = this.wallets.get(agentId);
    if (!wallet) throw new Error("Unregistered economic identity");
    if (wallet.balance < taskCost) throw new Error("INSUFFICIENT CREDITS");
    
    // Rule 5: Resource abuse limiter check could be performed here
    if (wallet.spending > 50000) {
        throw new Error("L-Credit Throttle Limit Exceeded");
    }

    wallet.balance -= taskCost;
    wallet.spending += taskCost;
  }

  rewardNode(nodeId, amount) {
    const wallet = this.wallets.get(nodeId);
    if (wallet) {
      wallet.balance += amount;
      wallet.earnings += amount;
    }
  }

  adjustCost(cost, reputation) {
    if (reputation > 50) return cost * 0.8;
    if (reputation < 0) return cost * 1.5;
    return cost;
  }
  
  processMarketBid(bids) {
    // Select cheapest and best
    bids.sort((a, b) => a.price - b.price);
    return bids[0];
  }
}
