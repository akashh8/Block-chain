import { useEffect, useState } from 'react';
import { AlertOctagon, Activity, Share2, Layers, ShieldCheck, Cpu, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getNodes, retrainModels } from '../services/api';
import StatusBadge from '../components/cards/StatusBadge';
import { formatScore } from '../utils/helpers';
import type { SupplyChainNode } from '../types';

export default function MaliciousNodeDashboard() {
  const [nodes, setNodes] = useState<SupplyChainNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);
  const [retrainMessage, setRetrainMessage] = useState('');

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainSuccess(false);
    try {
      const res = await retrainModels();
      if (res.data.success) {
        setRetrainSuccess(true);
        setRetrainMessage(res.data.message || 'GBRC models retrained successfully!');
        // Refresh nodes to see if status updated based on new weights
        const nodesRes = await getNodes();
        const malicious = nodesRes.data.data.filter(
          (n: SupplyChainNode) => n.status === 'Quarantine' || n.status === 'Slashed'
        );
        setNodes(malicious);
      }
    } catch (err: any) {
      alert('Error during GBRC retraining: ' + (err.message || err));
    } finally {
      setRetraining(false);
      setTimeout(() => setRetrainSuccess(false), 5000);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await getNodes();
        // Filter for Quarantine and Slashed nodes
        const malicious = res.data.data.filter(
          (n: SupplyChainNode) => n.status === 'Quarantine' || n.status === 'Slashed'
        );
        setNodes(malicious);
      } catch { /* noop */ } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gbrc-slashed flex items-center gap-2">
            <AlertOctagon />
            Malicious Node Dashboard
          </h1>
          <p className="text-gbrc-text-dim text-sm mt-1">
            Detailed breakdown of anomalous nodes caught by the ML pipeline
          </p>
        </div>
      </div>

      {/* ── Retraining intelligence banner ── */}
      <div className="glass-card p-6 border-gbrc-accent/30 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-gbrc-bg-light to-gbrc-accent/[0.02]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gbrc-accent/10 border border-gbrc-accent/20 flex items-center justify-center text-gbrc-accent shrink-0 shadow-md">
            <Cpu className="w-6 h-6 animate-pulse text-gbrc-accent-light" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">GBRC Intelligence Engine</h3>
            <p className="text-xs text-gbrc-text-dim mt-0.5 max-w-lg leading-normal">
              Retrain the decentralized Random Forest & Isolation Forest layers on the live transaction history and reputation ledger.
            </p>
          </div>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-300 border shadow-lg cursor-pointer ${
            retraining
              ? 'bg-gbrc-warning/10 border-gbrc-warning/30 text-gbrc-warning cursor-not-allowed'
              : retrainSuccess
              ? 'bg-gbrc-trusted/20 border-gbrc-trusted/40 text-gbrc-trusted shadow-gbrc-trusted/5'
              : 'btn-primary border-transparent'
          }`}
        >
          {retraining ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Calibrating ML layers...</span>
            </>
          ) : retrainSuccess ? (
            <>
              <CheckCircle2 size={14} className="text-gbrc-trusted" />
              <span>Retrained successfully</span>
            </>
          ) : (
            <>
              <RefreshCw size={14} />
              <span>Retrain GBRC models</span>
            </>
          )}
        </button>
      </div>

      {retrainSuccess && (
        <div className="p-3.5 bg-gbrc-trusted/10 border border-gbrc-trusted/20 text-gbrc-trusted rounded-xl text-xs font-semibold animate-fade-in flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gbrc-trusted animate-ping" />
          <span>{retrainMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-gbrc-slashed border-t-transparent rounded-full animate-spin" />
        </div>
      ) : nodes.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-gbrc-trusted/10 flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-gbrc-trusted" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Network is Secure</h2>
          <p className="text-gbrc-text-dim">No malicious nodes detected currently.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {nodes.map((node) => (
            <div key={node.nodeId} className="glass-card p-6 border-gbrc-slashed/30 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gbrc-slashed" />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">{node.name}</h3>
                  <p className="text-sm text-gbrc-text-dim font-mono">{node.nodeId}</p>
                </div>
                <StatusBadge status={node.status} size="md" />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                  <p className="text-xs text-gbrc-text-dim uppercase mb-1">Final Risk Score</p>
                  <p className="text-xl font-mono text-gbrc-slashed">
                    {formatScore(node.latestScores?.final || 0)}
                  </p>
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                  <p className="text-xs text-gbrc-text-dim uppercase mb-1">EWMA Reputation</p>
                  <p className="text-xl font-mono text-white">
                    {formatScore(node.ewmaReputation)}
                  </p>
                </div>
              </div>

              <h4 className="text-xs font-semibold text-gbrc-text-dim uppercase mb-3 border-b border-white/10 pb-2">
                ML Pipeline Breakdown
              </h4>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm flex items-center gap-2"><Activity size={14} className="text-gbrc-accent"/> Stage 2: Isolation Forest</span>
                    <span className="font-mono text-sm">{formatScore(node.latestScores?.isolation || 0)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gbrc-accent" 
                      style={{ width: `${(node.latestScores?.isolation || 0) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm flex items-center gap-2"><Share2 size={14} className="text-gbrc-warning"/> Stage 3: Random Forest</span>
                    <span className="font-mono text-sm">{formatScore(node.latestScores?.rf || 0)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gbrc-warning" 
                      style={{ width: `${(node.latestScores?.rf || 0) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm flex items-center gap-2"><Layers size={14} className="text-gbrc-cyan"/> Stage 4: Graph Analytics</span>
                    <span className="font-mono text-sm">{formatScore(node.latestScores?.graph || 0)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gbrc-cyan" 
                      style={{ width: `${(node.latestScores?.graph || 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
