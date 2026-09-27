// ─── Node Status ───────────────────────────────────────────
export type NodeStatus = 'Trusted' | 'Warning' | 'Quarantine' | 'Slashed';

export type NodeRole = 'manufacturer' | 'distributor' | 'pharmacy' | 'regulator';

export interface NodeCentralities {
  degree: number;
  betweenness: number;
  closeness: number;
  eigenvector: number;
}

export interface NodeScores {
  rf: number;
  isolation: number;
  graph: number;
  final: number;
}

export interface SupplyChainNode {
  _id: string;
  nodeId: string;
  name: string;
  role: NodeRole;
  reputation: number;
  ewmaReputation: number;
  status: NodeStatus;
  centralities: NodeCentralities;
  latestScores: NodeScores;
  totalTransactions: number;
  successfulTransactions: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Block ─────────────────────────────────────────────────
export interface Block {
  _id: string;
  blockNumber: number;
  hash: string;
  previousHash: string;
  timestamp: string;
  transactions: string[];
  transactionCount: number;
  sealer: string;
  createdAt: string;
}

// ─── Transaction ───────────────────────────────────────────
export interface Transaction {
  _id: string;
  txId: string;
  batchId: string;
  fromNode: string;
  toNode: string;
  drugId: string;
  quantity: number;
  volume: number;
  timestamp: string;
  fromNodeName?: string;
  toNodeName?: string;
}

// ─── Drug Batch ────────────────────────────────────────────
export type BatchStatus = 'active' | 'recalled' | 'expired';

export interface DrugBatch {
  _id: string;
  batchId: string;
  drugName: string;
  manufacturer: string;
  manufactureDate: string;
  expiryDate: string;
  currentHolder: string;
  status: BatchStatus;
  quantity: number;
  qrPayload: string;
  createdAt: string;
}

// ─── Reputation History ────────────────────────────────────
export interface ReputationHistoryEntry {
  _id: string;
  nodeId: string;
  timestamp: string;
  reputation: number;
  ewma: number;
}

// ─── Score History ─────────────────────────────────────────
export interface ScoreHistoryEntry {
  _id: string;
  nodeId: string;
  batchId: string;
  rf: number;
  isolation: number;
  graph: number;
  final: number;
  status: NodeStatus;
  timestamp: string;
}

// ─── Inventory ─────────────────────────────────────────────
export interface InventoryItem {
  _id: string;
  nodeId: string;
  batchId: string;
  stock: number;
  expiryDate: string;
  recalled: boolean;
  lowStockThreshold: number;
  nodeName?: string;
  drugName?: string;
}

// ─── Notification ──────────────────────────────────────────
export type NotificationType = 'transfer' | 'suspicious' | 'quarantine' | 'recall' | 'inventory' | 'slash';
export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface Notification {
  _id: string;
  type: NotificationType;
  message: string;
  severity: NotificationSeverity;
  nodeId?: string;
  batchId?: string;
  read: boolean;
  timestamp: string;
}

// ─── Analytics / Dashboard ─────────────────────────────────
export interface DashboardStats {
  totalBatches: number;
  activeNodes: number;
  networkTrust: number;
  totalTransactions: number;
  maliciousNodes: number;
  trustedNodes: number;
  warningNodes: number;
  quarantinedNodes: number;
}

export interface TrustDistribution {
  status: NodeStatus;
  count: number;
  percentage: number;
}

// ─── Graph Visualization ───────────────────────────────────
export interface GraphNode {
  id: string;
  name: string;
  role: NodeRole;
  status: NodeStatus;
  reputation: number;
  val: number;
}

export interface GraphLink {
  source: string;
  target: string;
  volume: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ─── API Response ──────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
