import axios from 'axios';
import type {
  ApiResponse,
  SupplyChainNode,
  Block,
  Transaction,
  DrugBatch,
  ReputationHistoryEntry,
  ScoreHistoryEntry,
  InventoryItem,
  Notification,
  DashboardStats,
  GraphData,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Nodes ─────────────────────────────────────────────────
export const getNodes = () => api.get<ApiResponse<SupplyChainNode[]>>('/nodes');
export const getNode = (id: string) => api.get<ApiResponse<SupplyChainNode>>(`/nodes/${id}`);
export const retrainModels = () => api.post<ApiResponse<{ message: string }>>('/nodes/train');

// ─── Blocks ────────────────────────────────────────────────
export const getBlocks = () => api.get<ApiResponse<Block[]>>('/blocks');
export const getBlock = (id: string) => api.get<ApiResponse<Block>>(`/blocks/${id}`);
export const searchBlocks = (query: string) => api.get<ApiResponse<Block[]>>(`/blocks/search?q=${query}`);

// ─── Transactions ──────────────────────────────────────────
export const getTransactions = () => api.get<ApiResponse<Transaction[]>>('/transactions');
export const submitBatch = (data: { transactions: Partial<Transaction>[] }) =>
  api.post<ApiResponse<{ block: Block; scores: Record<string, unknown> }>>('/transactions/batch', data);

// ─── Batches (Drug) ────────────────────────────────────────
export const getBatches = () => api.get<ApiResponse<DrugBatch[]>>('/batches');
export const getBatch = (id: string) => api.get<ApiResponse<DrugBatch>>(`/batches/${id}`);
export const verifyBatch = (batchId: string) => api.get<ApiResponse<{ authentic: boolean; recalled: boolean }>>(`/batches/${batchId}/verify`);

// ─── Recall ────────────────────────────────────────────────
export const initateRecall = (batchId: string) => api.post<ApiResponse<DrugBatch>>(`/recall/${batchId}`);
export const initiateRecall = initateRecall; // alias for correct spelling
export const getRecalls = () => api.get<ApiResponse<DrugBatch[]>>('/recall');

// ─── Reputation ────────────────────────────────────────────
export const getReputationRankings = () => api.get<ApiResponse<SupplyChainNode[]>>('/reputation/rankings');
export const getReputationHistory = (nodeId: string) =>
  api.get<ApiResponse<ReputationHistoryEntry[]>>(`/reputation/history/${nodeId}`);

// ─── Scores ────────────────────────────────────────────────
export const getScoreHistory = (nodeId: string) =>
  api.get<ApiResponse<ScoreHistoryEntry[]>>(`/analytics/scores/${nodeId}`);

// ─── Analytics ─────────────────────────────────────────────
export const getDashboardStats = () => api.get<ApiResponse<DashboardStats>>('/analytics/dashboard');
export const getGraphData = () => api.get<ApiResponse<GraphData>>('/analytics/graph');
export const getCentralityData = () => api.get<ApiResponse<SupplyChainNode[]>>('/analytics/centrality');
export const getAnalyticsCentrality = getCentralityData; // alias
export const getTrustDistribution = () => api.get<ApiResponse<{ status: string; count: number }[]>>('/analytics/trust-distribution');
export const getTransactionVolume = () => api.get<ApiResponse<{ date: string; volume: number }[]>>('/analytics/transaction-volume');
export const getAnalyticsTransactionVolume = getTransactionVolume; // alias

// ─── Inventory ─────────────────────────────────────────────
export const getInventory = () => api.get<ApiResponse<InventoryItem[]>>('/inventory');
export const getInventoryAlerts = () => api.get<ApiResponse<InventoryItem[]>>('/inventory/alerts');

// ─── Notifications ─────────────────────────────────────────
export const getNotifications = () => api.get<ApiResponse<Notification[]>>('/notifications');
export const markNotificationRead = (id: string) => api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.patch<ApiResponse<void>>('/notifications/read-all');

// ─── Pipeline ──────────────────────────────────────────────
export const runPipeline = () => api.post<ApiResponse<unknown>>('/pipeline/run');

export default api;
