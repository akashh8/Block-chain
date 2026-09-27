import { useEffect, useState } from 'react';
import { Shield, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getReputationRankings } from '../services/api';
import StatusBadge from '../components/cards/StatusBadge';
import { formatScore, formatPercent } from '../utils/helpers';
import type { SupplyChainNode } from '../types';
import { useNodeSocket } from '../hooks/useSocket';

export default function ReputationDashboard() {
  const [nodes, setNodes] = useState<SupplyChainNode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRankings = async () => {
    try {
      const res = await getReputationRankings();
      setNodes(res.data.data);
    } catch { /* noop */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  useNodeSocket((update: any) => {
    setNodes((prev) => 
      prev.map((n) => 
        n.nodeId === update.nodeId 
          ? { ...n, status: update.newStatus, reputation: update.finalScore, ewmaReputation: update.finalScore } 
          : n
      ).sort((a, b) => b.ewmaReputation - a.ewmaReputation)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="text-gbrc-accent" />
          Reputation Rankings
        </h1>
        <p className="text-gbrc-text-dim text-sm mt-1">
          Beta-Binomial + EWMA reputation scores driving consensus
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-gbrc-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gbrc-card-border/50 bg-white/[0.02]">
                  <th className="table-header py-4 px-6 w-16 text-center">Rank</th>
                  <th className="table-header py-4 px-6">Node</th>
                  <th className="table-header py-4 px-6">Status</th>
                  <th className="table-header py-4 px-6 text-right">EWMA Score</th>
                  <th className="table-header py-4 px-6 text-right">Beta Rep</th>
                  <th className="table-header py-4 px-6 text-center">Trend</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node, index) => {
                  const trend = node.reputation - node.ewmaReputation;
                  return (
                    <tr 
                      key={node.nodeId}
                      className="border-b border-gbrc-card-border/30 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="table-cell px-6 text-center font-mono text-gbrc-text-dim">
                        {index + 1}
                      </td>
                      <td className="table-cell px-6">
                        <div>
                          <p className="font-medium text-white">{node.name}</p>
                          <p className="text-xs text-gbrc-text-dim">{node.nodeId}</p>
                        </div>
                      </td>
                      <td className="table-cell px-6">
                        <StatusBadge status={node.status} />
                      </td>
                      <td className="table-cell px-6 text-right font-mono text-white">
                        {formatScore(node.ewmaReputation)}
                      </td>
                      <td className="table-cell px-6 text-right font-mono text-gbrc-text-dim">
                        {formatScore(node.reputation)}
                      </td>
                      <td className="table-cell px-6 text-center">
                        <div className="flex justify-center">
                          {trend > 0.01 ? (
                            <TrendingUp size={16} className="text-gbrc-trusted" />
                          ) : trend < -0.01 ? (
                            <TrendingDown size={16} className="text-gbrc-slashed" />
                          ) : (
                            <Minus size={16} className="text-gbrc-text-dim" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
