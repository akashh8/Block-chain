import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Boxes, Users, ShieldCheck, ArrowRightLeft, AlertTriangle, Blocks } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import KPICard from '../components/cards/KPICard';
import StatusBadge from '../components/cards/StatusBadge';
import { getDashboardStats, getTrustDistribution, getNodes, getNotifications } from '../services/api';
import type { DashboardStats, SupplyChainNode, Notification as NotifType } from '../types';
import { formatDateTime, getRoleIcon } from '../utils/helpers';

const STATUS_COLORS: Record<string, string> = {
  Trusted: '#22c55e',
  Warning: '#eab308',
  Quarantine: '#f97316',
  Slashed: '#ef4444',
};

export default function ExecutiveDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trustDist, setTrustDist] = useState<{ status: string; count: number }[]>([]);
  const [nodes, setNodes] = useState<SupplyChainNode[]>([]);
  const [recentNotifs, setRecentNotifs] = useState<NotifType[]>([]);

  useEffect(() => {
    async function load() {
      const [statsRes, trustRes, nodesRes, notifsRes] = await Promise.all([
        getDashboardStats(),
        getTrustDistribution(),
        getNodes(),
        getNotifications(),
      ]);
      setStats(statsRes.data.data);
      setTrustDist(trustRes.data.data);
      setNodes(nodesRes.data.data);
      setRecentNotifs(notifsRes.data.data.slice(0, 5));
    }
    load();
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-gbrc-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
        <p className="text-gbrc-text-dim text-sm mt-1">Pharmaceutical Supply Chain Security Overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard title="Total Batches" value={stats.totalBatches} icon={Boxes} color="#3b82f6" delay={0} />
        <KPICard title="Active Nodes" value={stats.activeNodes} icon={Users} color="#06b6d4" delay={1} />
        <KPICard title="Network Trust" value={stats.networkTrust} format="decimal" icon={ShieldCheck} color="#22c55e" delay={2} />
        <KPICard title="Transactions" value={stats.totalTransactions} icon={ArrowRightLeft} color="#8b5cf6" delay={3} />
        <KPICard title="Malicious Nodes" value={stats.maliciousNodes} icon={AlertTriangle} color="#ef4444" delay={4} />
      </div>

      {/* Charts + Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trust Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5"
        >
          <h2 className="section-title mb-4">Trust Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={trustDist}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                strokeWidth={0}
              >
                {trustDist.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(15, 22, 41, 0.95)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {trustDist.map((d) => (
              <div key={d.status} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[d.status] }} />
                <span className="text-xs text-gbrc-text-dim">{d.status}: {d.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Node List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5"
        >
          <h2 className="section-title mb-4">Network Nodes</h2>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {nodes.map((node) => (
              <div
                key={node.nodeId}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getRoleIcon(node.role)}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{node.name}</p>
                    <p className="text-xs text-gbrc-text-dim">{node.nodeId}</p>
                  </div>
                </div>
                <StatusBadge status={node.status} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-5"
        >
          <h2 className="section-title mb-4">Recent Alerts</h2>
          <div className="space-y-3 max-h-[280px] overflow-y-auto">
            {recentNotifs.map((n) => (
              <div
                key={n._id}
                className="p-3 rounded-lg bg-white/[0.02] border border-gbrc-card-border/50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium uppercase tracking-wider ${
                    n.severity === 'critical' ? 'text-gbrc-slashed' :
                    n.severity === 'warning' ? 'text-gbrc-warning' :
                    'text-gbrc-accent'
                  }`}>
                    {n.type}
                  </span>
                </div>
                <p className="text-sm text-gbrc-text leading-relaxed">{n.message}</p>
                <p className="text-xs text-gbrc-text-dim mt-1">{formatDateTime(n.timestamp)}</p>
              </div>
            ))}
            {recentNotifs.length === 0 && (
              <p className="text-sm text-gbrc-text-dim text-center py-8">No recent alerts</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
