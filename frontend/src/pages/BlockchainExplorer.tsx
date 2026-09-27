import React, { useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronUp, Box, Hash, Clock, ShieldCheck } from 'lucide-react';
import { getBlocks, searchBlocks } from '../services/api';
import type { Block } from '../types';
import { truncateHash, formatDateTime } from '../utils/helpers';
import { useBlockSocket } from '../hooks/useSocket';

export default function BlockchainExplorer() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);

  const fetchBlocks = async (query = '') => {
    setLoading(true);
    try {
      const res = query ? await searchBlocks(query) : await getBlocks();
      setBlocks(res.data.data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  useBlockSocket((newBlock: any) => {
    if (!searchQuery) {
      setBlocks((prev) => [newBlock, ...prev]);
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBlocks(searchQuery);
  };

  const toggleExpand = (blockNum: number) => {
    setExpandedBlock(expandedBlock === blockNum ? null : blockNum);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Blockchain Explorer</h1>
          <p className="text-gbrc-text-dim text-sm mt-1">Verify supply chain integrity on the immutable ledger</p>
        </div>
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gbrc-text-dim" />
          <input
            type="text"
            placeholder="Search by block #, hash, sealer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pl-10"
          />
        </form>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-gbrc-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : blocks.length === 0 ? (
          <div className="py-12 text-center text-gbrc-text-dim">No blocks found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gbrc-card-border/50 bg-white/[0.02]">
                  <th className="table-header py-4 px-6">Block</th>
                  <th className="table-header py-4 px-6">Hash</th>
                  <th className="table-header py-4 px-6">Transactions</th>
                  <th className="table-header py-4 px-6">Sealer</th>
                  <th className="table-header py-4 px-6">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((block) => (
                  <React.Fragment key={block.blockNumber}>
                    <tr 
                      onClick={() => toggleExpand(block.blockNumber)}
                      className={`border-b border-gbrc-card-border/30 hover:bg-white/[0.02] cursor-pointer transition-colors ${
                        expandedBlock === block.blockNumber ? 'bg-white/[0.03]' : ''
                      }`}
                    >
                      <td className="table-cell px-6">
                        <div className="flex items-center gap-2">
                          <Box size={16} className="text-gbrc-accent" />
                          <span className="font-mono text-white">#{block.blockNumber}</span>
                        </div>
                      </td>
                      <td className="table-cell px-6">
                        <div className="flex items-center gap-2">
                          <Hash size={14} className="text-gbrc-text-dim" />
                          <span className="font-mono text-sm" title={block.hash}>
                            {truncateHash(block.hash, 10)}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell px-6">
                        <span className="badge bg-gbrc-accent/10 text-gbrc-accent border-gbrc-accent/20">
                          {block.transactionCount} txs
                        </span>
                      </td>
                      <td className="table-cell px-6">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-gbrc-trusted" />
                          <span>{block.sealer}</span>
                        </div>
                      </td>
                      <td className="table-cell px-6">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gbrc-text-dim" />
                          <span className="text-sm">{formatDateTime(block.timestamp)}</span>
                          {expandedBlock === block.blockNumber ? (
                            <ChevronUp size={16} className="ml-auto text-gbrc-text-dim" />
                          ) : (
                            <ChevronDown size={16} className="ml-auto text-gbrc-text-dim" />
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedBlock === block.blockNumber && (
                      <tr className="bg-black/20 border-b border-gbrc-card-border/50">
                        <td colSpan={5} className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-xs font-semibold text-gbrc-text-dim uppercase mb-3">Block Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                  <span className="text-gbrc-text-dim">Full Hash:</span>
                                  <span className="font-mono text-white break-all ml-4">{block.hash}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                  <span className="text-gbrc-text-dim">Previous Hash:</span>
                                  <span className="font-mono text-white break-all ml-4">{block.previousHash}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-gbrc-text-dim uppercase mb-3">Transactions in Block</h4>
                              <div className="bg-black/40 rounded-lg p-3 max-h-40 overflow-y-auto font-mono text-xs text-gbrc-text space-y-1">
                                {block.transactions.map((txId, idx) => (
                                  <div key={idx} className="flex gap-2">
                                    <span className="text-gbrc-text-dim">[{idx}]</span>
                                    <span className="text-gbrc-cyan">{txId}</span>
                                  </div>
                                ))}
                                {block.transactions.length === 0 && (
                                  <span className="text-gbrc-text-dim italic">No transactions (Genesis Block)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
