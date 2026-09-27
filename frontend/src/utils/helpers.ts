import type { NodeStatus } from '../types';

export function getStatusColor(status: NodeStatus): string {
  switch (status) {
    case 'Trusted': return '#22c55e';
    case 'Warning': return '#eab308';
    case 'Quarantine': return '#f97316';
    case 'Slashed': return '#ef4444';
    default: return '#94a3b8';
  }
}

export function getStatusBgClass(status: NodeStatus): string {
  switch (status) {
    case 'Trusted': return 'status-trusted';
    case 'Warning': return 'status-warning';
    case 'Quarantine': return 'status-quarantine';
    case 'Slashed': return 'status-slashed';
    default: return '';
  }
}

export function truncateHash(hash: string, length = 8): string {
  if (!hash) return '';
  return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatScore(value: number): string {
  return value.toFixed(4);
}

export function getRoleIcon(role: string): string {
  switch (role) {
    case 'manufacturer': return '🏭';
    case 'distributor': return '🚚';
    case 'pharmacy': return '💊';
    case 'regulator': return '🏛️';
    default: return '📦';
  }
}
