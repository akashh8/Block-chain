import { useEffect, useState } from 'react';
import { BarChart3, Activity, ArrowUpRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { getAnalyticsTransactionVolume, getAnalyticsCentrality } from '../services/api';
import { formatNumber } from '../utils/helpers';
import type { SupplyChainNode } from '../types';

export default function AnalyticsDashboard() {
  const [txVolume, setTxVolume] = useState<{ date: string; volume: number; count: number }[]>([]);
  const [centralityNodes, setCentralityNodes] = useState<SupplyChainNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [volRes, centRes] = await Promise.all([
          getAnalyticsTransactionVolume(),
          getAnalyticsCentrality()
        ]);
        setTxVolume(volRes.data.data);
        
        // Sort nodes by PageRank (eigenvector centrality equivalent in our ML service)
        const sortedCent = centRes.data.data.sort((a: any, b: any) => 
          (b.centralities?.eigenvector || 0) - (a.centralities?.eigenvector || 0)
        );
        setCentralityNodes(sortedCent.slice(0, 10)); // Top 10
      } catch { /* noop */ } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="text-gbrc-accent" />
          Analytics & Metrics
        </h1>
        <p className="text-gbrc-text-dim text-sm mt-1">
          Historical trends and graph centrality analysis
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-gbrc-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Transaction Volume Chart */}
          <div className="glass-card p-6 lg:col-span-2">
            <h2 className="section-title mb-6 flex items-center gap-2">
              <Activity size={18} />
              Transaction Volume (30 Days)
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={txVolume}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={12}
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12}
                    tickFormatter={(val) => formatNumber(val)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 22, 41, 0.95)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorVolume)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Network Centrality (PageRank) */}
          <div className="glass-card p-6 lg:col-span-2">
            <h2 className="section-title mb-6 flex items-center gap-2">
              <ArrowUpRight size={18} />
              Top Nodes by Graph Centrality (PageRank)
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={centralityNodes} layout="vertical" margin={{ left: 50, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={12} 
                    axisLine={false} 
                    tickLine={false}
                    width={150}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{
                      background: 'rgba(15, 22, 41, 0.95)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                    }}
                    formatter={(val: any) => val.toFixed(4)}
                  />
                  <Bar 
                    dataKey="centralities.eigenvector" 
                    name="Eigenvector Centrality"
                    fill="#06b6d4" 
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
