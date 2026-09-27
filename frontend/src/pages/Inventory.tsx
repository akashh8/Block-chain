import { useEffect, useState } from 'react';
import { Warehouse, AlertTriangle, Clock } from 'lucide-react';
import { getInventory, getInventoryAlerts } from '../services/api';
import { formatDateTime } from '../utils/helpers';
import type { InventoryItem } from '../types';

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'alerts'>('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [invRes, alertsRes] = await Promise.all([
          getInventory(),
          getInventoryAlerts(),
        ]);
        setInventory(invRes.data.data);
        setAlerts(alertsRes.data.data);
      } catch { /* noop */ } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const displayData = activeTab === 'all' ? inventory : alerts;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Warehouse className="text-gbrc-accent" />
            Inventory Tracking
          </h1>
          <p className="text-gbrc-text-dim text-sm mt-1">
            Real-time stock levels and low-inventory alerts across the network
          </p>
        </div>
        
        <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'all' ? 'bg-white/10 text-white' : 'text-gbrc-text-dim hover:text-white'
            }`}
          >
            All Inventory
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'alerts' ? 'bg-gbrc-warning/20 text-gbrc-warning' : 'text-gbrc-text-dim hover:text-gbrc-warning'
            }`}
          >
            <AlertTriangle size={14} />
            Alerts
            {alerts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gbrc-warning/30 text-gbrc-warning text-[10px]">
                {alerts.length}
              </span>
            )}
          </button>
        </div>
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
                  <th className="table-header py-4 px-6">Node / Location</th>
                  <th className="table-header py-4 px-6">Batch ID</th>
                  <th className="table-header py-4 px-6">Drug Name</th>
                  <th className="table-header py-4 px-6 text-right">Stock Level</th>
                  <th className="table-header py-4 px-6">Status</th>
                  <th className="table-header py-4 px-6">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((item) => {
                  const isLowStock = item.stock <= item.lowStockThreshold;
                  const isRecalled = item.recalled;
                  const daysToExpiry = Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isExpiring = daysToExpiry <= 90;

                  return (
                    <tr 
                      key={`${item.nodeId}-${item.batchId}`}
                      className="border-b border-gbrc-card-border/30 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="table-cell px-6 font-medium text-white">
                        {item.nodeName} <span className="text-xs text-gbrc-text-dim font-mono ml-1">({item.nodeId})</span>
                      </td>
                      <td className="table-cell px-6 font-mono text-sm">{item.batchId}</td>
                      <td className="table-cell px-6">{item.drugName}</td>
                      <td className="table-cell px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`font-mono text-lg ${isLowStock ? 'text-gbrc-warning' : 'text-white'}`}>
                            {item.stock}
                          </span>
                          <span className="text-xs text-gbrc-text-dim">/ {item.lowStockThreshold} min</span>
                        </div>
                      </td>
                      <td className="table-cell px-6">
                        <div className="flex flex-col gap-1">
                          {isRecalled && (
                            <span className="badge bg-gbrc-slashed/10 text-gbrc-slashed border-gbrc-slashed/20 text-[10px]">
                              RECALLED
                            </span>
                          )}
                          {isLowStock && !isRecalled && (
                            <span className="badge bg-gbrc-warning/10 text-gbrc-warning border-gbrc-warning/20 text-[10px]">
                              LOW STOCK
                            </span>
                          )}
                          {!isRecalled && !isLowStock && !isExpiring && (
                            <span className="badge bg-gbrc-trusted/10 text-gbrc-trusted border-gbrc-trusted/20 text-[10px]">
                              HEALTHY
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell px-6">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className={isExpiring ? 'text-gbrc-warning' : 'text-gbrc-text-dim'} />
                          <span className={`text-sm ${isExpiring ? 'text-gbrc-warning font-medium' : 'text-gbrc-text'}`}>
                            {formatDateTime(item.expiryDate).split(',')[0]}
                          </span>
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
