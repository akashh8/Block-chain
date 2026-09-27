import { useEffect, useState } from 'react';
import { Package, AlertTriangle, ShieldCheck, Box } from 'lucide-react';
import { getBatches, initiateRecall } from '../services/api';
import { formatDateTime } from '../utils/helpers';
import type { DrugBatch } from '../types';
import { useRecallSocket } from '../hooks/useSocket';

export default function DrugRecall() {
  const [batches, setBatches] = useState<DrugBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchBatches = async () => {
    try {
      const res = await getBatches();
      setBatches(res.data.data);
    } catch { /* noop */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  useRecallSocket((update: any) => {
    setBatches((prev) => 
      prev.map((b) => b.batchId === update.batchId ? { ...b, status: 'recalled' } : b)
    );
  });

  const handleRecall = async (batchId: string) => {
    if (!window.confirm(`CRITICAL ACTION: Are you sure you want to recall batch ${batchId}? This will notify all nodes holding the inventory and write a recall transaction to the blockchain.`)) {
      return;
    }
    
    setProcessing(batchId);
    try {
      await initiateRecall(batchId);
      // Local state update handled by socket or re-fetch
      await fetchBatches();
    } catch (err) {
      alert('Failed to initiate recall');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Package className="text-gbrc-accent" />
          Drug Recall Management
        </h1>
        <p className="text-gbrc-text-dim text-sm mt-1">
          Monitor batches and initiate network-wide recalls
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
                  <th className="table-header py-4 px-6">Batch ID</th>
                  <th className="table-header py-4 px-6">Drug Name</th>
                  <th className="table-header py-4 px-6">Manufacturer</th>
                  <th className="table-header py-4 px-6">Manufacture Date</th>
                  <th className="table-header py-4 px-6">Expiry Date</th>
                  <th className="table-header py-4 px-6">Status</th>
                  <th className="table-header py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const isRecalled = batch.status === 'recalled';
                  const isProcessing = processing === batch.batchId;
                  
                  return (
                    <tr 
                      key={batch.batchId}
                      className={`border-b border-gbrc-card-border/30 transition-colors ${
                        isRecalled ? 'bg-gbrc-slashed/[0.02]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="table-cell px-6">
                        <div className="flex items-center gap-2">
                          <Box size={14} className={isRecalled ? 'text-gbrc-slashed' : 'text-gbrc-text-dim'} />
                          <span className="font-mono text-white">{batch.batchId}</span>
                        </div>
                      </td>
                      <td className="table-cell px-6 font-medium text-white">{batch.drugName}</td>
                      <td className="table-cell px-6 text-gbrc-text-dim">{batch.manufacturer}</td>
                      <td className="table-cell px-6 text-sm">{formatDateTime(batch.manufactureDate).split(',')[0]}</td>
                      <td className="table-cell px-6 text-sm">{formatDateTime(batch.expiryDate).split(',')[0]}</td>
                      <td className="table-cell px-6">
                        {isRecalled ? (
                          <span className="badge bg-gbrc-slashed/10 text-gbrc-slashed border-gbrc-slashed/20">
                            <AlertTriangle size={12} className="mr-1" /> RECALLED
                          </span>
                        ) : (
                          <span className="badge bg-gbrc-trusted/10 text-gbrc-trusted border-gbrc-trusted/20">
                            <ShieldCheck size={12} className="mr-1" /> ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="table-cell px-6 text-right">
                        {!isRecalled && (
                          <button
                            onClick={() => handleRecall(batch.batchId)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gbrc-slashed/10 text-gbrc-slashed hover:bg-gbrc-slashed/20 border border-gbrc-slashed/20 transition-colors disabled:opacity-50"
                          >
                            {isProcessing ? 'Processing...' : 'Initiate Recall'}
                          </button>
                        )}
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
