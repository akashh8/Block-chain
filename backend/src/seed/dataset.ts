/**
 * GBRC Sample Pharmaceutical Supply Chain Dataset
 *
 * 12 nodes: 3 manufacturers, 4 distributors, 5 pharmacies
 * 8 drug products with realistic names
 * 50+ transactions forming supply chain paths
 * 3 injected anomalous nodes with unusual behavior patterns
 */

export const NODES = [
  // Manufacturers
  { nodeId: 'MFG-001', name: 'PharmaCure Labs', role: 'manufacturer' as const },
  { nodeId: 'MFG-002', name: 'BioGenesis Pharma', role: 'manufacturer' as const },
  { nodeId: 'MFG-003', name: 'NovaMed Industries', role: 'manufacturer' as const },

  // Distributors
  { nodeId: 'DST-001', name: 'MediFlow Distribution', role: 'distributor' as const },
  { nodeId: 'DST-002', name: 'GlobalPharma Logistics', role: 'distributor' as const },
  { nodeId: 'DST-003', name: 'SwiftMed Supply Co.', role: 'distributor' as const },
  { nodeId: 'DST-004', name: 'DarkNet Distributors', role: 'distributor' as const }, // ANOMALOUS

  // Pharmacies
  { nodeId: 'PHR-001', name: 'CityHealth Pharmacy', role: 'pharmacy' as const },
  { nodeId: 'PHR-002', name: 'WellCare Rx', role: 'pharmacy' as const },
  { nodeId: 'PHR-003', name: 'MediPlus Drugstore', role: 'pharmacy' as const },
  { nodeId: 'PHR-004', name: 'ShadowPharm Outlet', role: 'pharmacy' as const }, // ANOMALOUS
  { nodeId: 'PHR-005', name: 'QuickFix Pharmacy', role: 'pharmacy' as const }, // ANOMALOUS
];

export const DRUGS = [
  { drugId: 'DRG-001', name: 'Amoxicillin 500mg', manufacturer: 'MFG-001' },
  { drugId: 'DRG-002', name: 'Metformin 850mg', manufacturer: 'MFG-001' },
  { drugId: 'DRG-003', name: 'Lisinopril 10mg', manufacturer: 'MFG-002' },
  { drugId: 'DRG-004', name: 'Omeprazole 20mg', manufacturer: 'MFG-002' },
  { drugId: 'DRG-005', name: 'Atorvastatin 40mg', manufacturer: 'MFG-003' },
  { drugId: 'DRG-006', name: 'Amlodipine 5mg', manufacturer: 'MFG-003' },
  { drugId: 'DRG-007', name: 'Sertraline 50mg', manufacturer: 'MFG-001' },
  { drugId: 'DRG-008', name: 'Losartan 100mg', manufacturer: 'MFG-002' },
];

export const BATCHES = [
  {
    batchId: 'BAT-2024-001', drugName: 'Amoxicillin 500mg', manufacturer: 'MFG-001',
    manufactureDate: new Date('2024-01-15'), expiryDate: new Date('2026-01-15'),
    currentHolder: 'DST-001', status: 'active' as const, quantity: 10000,
  },
  {
    batchId: 'BAT-2024-002', drugName: 'Metformin 850mg', manufacturer: 'MFG-001',
    manufactureDate: new Date('2024-02-01'), expiryDate: new Date('2026-02-01'),
    currentHolder: 'DST-002', status: 'active' as const, quantity: 8000,
  },
  {
    batchId: 'BAT-2024-003', drugName: 'Lisinopril 10mg', manufacturer: 'MFG-002',
    manufactureDate: new Date('2024-01-20'), expiryDate: new Date('2026-01-20'),
    currentHolder: 'PHR-001', status: 'active' as const, quantity: 5000,
  },
  {
    batchId: 'BAT-2024-004', drugName: 'Omeprazole 20mg', manufacturer: 'MFG-002',
    manufactureDate: new Date('2024-03-10'), expiryDate: new Date('2025-09-10'),
    currentHolder: 'PHR-002', status: 'active' as const, quantity: 6000,
  },
  {
    batchId: 'BAT-2024-005', drugName: 'Atorvastatin 40mg', manufacturer: 'MFG-003',
    manufactureDate: new Date('2024-02-15'), expiryDate: new Date('2026-02-15'),
    currentHolder: 'DST-003', status: 'active' as const, quantity: 12000,
  },
  {
    batchId: 'BAT-2024-006', drugName: 'Amlodipine 5mg', manufacturer: 'MFG-003',
    manufactureDate: new Date('2024-04-01'), expiryDate: new Date('2026-04-01'),
    currentHolder: 'PHR-003', status: 'active' as const, quantity: 7500,
  },
  {
    batchId: 'BAT-2024-007', drugName: 'Sertraline 50mg', manufacturer: 'MFG-001',
    manufactureDate: new Date('2024-03-20'), expiryDate: new Date('2025-08-20'),
    currentHolder: 'DST-004', status: 'active' as const, quantity: 4000,
  },
  {
    batchId: 'BAT-2024-008', drugName: 'Losartan 100mg', manufacturer: 'MFG-002',
    manufactureDate: new Date('2024-05-01'), expiryDate: new Date('2026-05-01'),
    currentHolder: 'PHR-001', status: 'active' as const, quantity: 9000,
  },
];

// Helper to generate date offsets
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Generate transactions forming realistic supply chain paths.
 * Normal nodes: moderate volume, standard frequency.
 * Anomalous nodes (DST-004, PHR-004, PHR-005): unusual volume spikes and frequency.
 */
export function generateTransactions(): Array<{
  txId: string;
  batchId: string;
  fromNode: string;
  toNode: string;
  drugId: string;
  quantity: number;
  volume: number;
  timestamp: Date;
}> {
  const transactions: Array<{
    txId: string;
    batchId: string;
    fromNode: string;
    toNode: string;
    drugId: string;
    quantity: number;
    volume: number;
    timestamp: Date;
  }> = [];
  let txCounter = 1;

  function tx(
    batchId: string, fromNode: string, toNode: string,
    drugId: string, quantity: number, volume: number, daysOffset: number
  ) {
    transactions.push({
      txId: `TX-${String(txCounter++).padStart(4, '0')}`,
      batchId, fromNode, toNode, drugId, quantity, volume,
      timestamp: daysAgo(daysOffset),
    });
  }

  // ── Normal Supply Chain Paths ──

  // Path 1: MFG-001 → DST-001 → PHR-001 (Amoxicillin)
  tx('BAT-2024-001', 'MFG-001', 'DST-001', 'DRG-001', 5000, 25000, 60);
  tx('BAT-2024-001', 'DST-001', 'PHR-001', 'DRG-001', 2000, 12000, 55);
  tx('BAT-2024-001', 'DST-001', 'PHR-002', 'DRG-001', 1500, 9000, 53);
  tx('BAT-2024-001', 'DST-001', 'PHR-003', 'DRG-001', 1500, 9000, 51);

  // Path 2: MFG-001 → DST-002 → PHR-002 (Metformin)
  tx('BAT-2024-002', 'MFG-001', 'DST-002', 'DRG-002', 4000, 16000, 50);
  tx('BAT-2024-002', 'DST-002', 'PHR-001', 'DRG-002', 1500, 6000, 45);
  tx('BAT-2024-002', 'DST-002', 'PHR-002', 'DRG-002', 2000, 8000, 43);

  // Path 3: MFG-002 → DST-001 → PHR-001 (Lisinopril)
  tx('BAT-2024-003', 'MFG-002', 'DST-001', 'DRG-003', 5000, 30000, 58);
  tx('BAT-2024-003', 'DST-001', 'PHR-001', 'DRG-003', 2500, 15000, 52);
  tx('BAT-2024-003', 'DST-001', 'PHR-003', 'DRG-003', 2500, 15000, 50);

  // Path 4: MFG-002 → DST-002 → PHR-002 (Omeprazole)
  tx('BAT-2024-004', 'MFG-002', 'DST-002', 'DRG-004', 6000, 24000, 40);
  tx('BAT-2024-004', 'DST-002', 'PHR-002', 'DRG-004', 3000, 12000, 35);
  tx('BAT-2024-004', 'DST-002', 'PHR-001', 'DRG-004', 3000, 12000, 33);

  // Path 5: MFG-003 → DST-003 → PHR-003 (Atorvastatin)
  tx('BAT-2024-005', 'MFG-003', 'DST-003', 'DRG-005', 6000, 42000, 45);
  tx('BAT-2024-005', 'DST-003', 'PHR-001', 'DRG-005', 2000, 14000, 40);
  tx('BAT-2024-005', 'DST-003', 'PHR-003', 'DRG-005', 2000, 14000, 38);
  tx('BAT-2024-005', 'DST-003', 'PHR-002', 'DRG-005', 2000, 14000, 36);

  // Path 6: MFG-003 → DST-001 → PHR-003 (Amlodipine)
  tx('BAT-2024-006', 'MFG-003', 'DST-001', 'DRG-006', 7500, 30000, 30);
  tx('BAT-2024-006', 'DST-001', 'PHR-003', 'DRG-006', 3000, 12000, 25);
  tx('BAT-2024-006', 'DST-001', 'PHR-001', 'DRG-006', 2000, 8000, 23);

  // Path 7: MFG-001 → DST-003 → PHR-001 (Sertraline — normal part)
  tx('BAT-2024-007', 'MFG-001', 'DST-003', 'DRG-007', 4000, 20000, 28);
  tx('BAT-2024-007', 'DST-003', 'PHR-001', 'DRG-007', 2000, 10000, 22);

  // Path 8: MFG-002 → DST-001 → PHR-001 (Losartan)
  tx('BAT-2024-008', 'MFG-002', 'DST-001', 'DRG-008', 9000, 45000, 20);
  tx('BAT-2024-008', 'DST-001', 'PHR-001', 'DRG-008', 3000, 15000, 15);
  tx('BAT-2024-008', 'DST-001', 'PHR-002', 'DRG-008', 3000, 15000, 13);

  // ── ANOMALOUS Transactions (injected for ML detection) ──

  // DST-004 "DarkNet Distributors" — unusual high-volume, high-frequency transactions
  // Volume is 3-5x normal, suggesting counterfeit or diverted drugs
  tx('BAT-2024-007', 'MFG-001', 'DST-004', 'DRG-007', 2000, 10000, 26);
  tx('BAT-2024-007', 'DST-004', 'PHR-004', 'DRG-007', 5000, 85000, 24); // Volume spike!
  tx('BAT-2024-007', 'DST-004', 'PHR-005', 'DRG-007', 4000, 72000, 23); // Volume spike!
  tx('BAT-2024-001', 'DST-004', 'PHR-004', 'DRG-001', 8000, 120000, 20); // Huge volume
  tx('BAT-2024-003', 'DST-004', 'PHR-005', 'DRG-003', 7000, 98000, 18); // Huge volume
  tx('BAT-2024-005', 'DST-004', 'PHR-004', 'DRG-005', 6000, 110000, 15); // Huge volume

  // PHR-004 "ShadowPharm Outlet" — receives from anomalous distributor, high incoming volume
  tx('BAT-2024-002', 'DST-004', 'PHR-004', 'DRG-002', 9000, 130000, 12); // Suspicious source
  tx('BAT-2024-004', 'DST-004', 'PHR-004', 'DRG-004', 5500, 88000, 10);

  // PHR-005 "QuickFix Pharmacy" — rapid-fire small transactions (structuring pattern)
  tx('BAT-2024-001', 'DST-004', 'PHR-005', 'DRG-001', 500, 3000, 14);
  tx('BAT-2024-001', 'DST-004', 'PHR-005', 'DRG-001', 500, 3100, 14);
  tx('BAT-2024-001', 'DST-004', 'PHR-005', 'DRG-001', 500, 2900, 13);
  tx('BAT-2024-002', 'DST-004', 'PHR-005', 'DRG-002', 600, 3600, 12);
  tx('BAT-2024-002', 'DST-004', 'PHR-005', 'DRG-002', 600, 3500, 11);
  tx('BAT-2024-003', 'DST-004', 'PHR-005', 'DRG-003', 700, 4200, 10);
  tx('BAT-2024-003', 'DST-004', 'PHR-005', 'DRG-003', 700, 4100, 9);
  tx('BAT-2024-004', 'DST-004', 'PHR-005', 'DRG-004', 800, 4800, 8);

  // More normal transactions to establish baseline
  tx('BAT-2024-001', 'MFG-001', 'DST-002', 'DRG-001', 3000, 15000, 48);
  tx('BAT-2024-001', 'DST-002', 'PHR-003', 'DRG-001', 1500, 9000, 44);
  tx('BAT-2024-005', 'MFG-003', 'DST-001', 'DRG-005', 4000, 28000, 42);
  tx('BAT-2024-005', 'DST-001', 'PHR-002', 'DRG-005', 2000, 14000, 39);
  tx('BAT-2024-006', 'MFG-003', 'DST-002', 'DRG-006', 3000, 12000, 27);
  tx('BAT-2024-006', 'DST-002', 'PHR-001', 'DRG-006', 1500, 6000, 21);
  tx('BAT-2024-008', 'MFG-002', 'DST-003', 'DRG-008', 4500, 22500, 18);
  tx('BAT-2024-008', 'DST-003', 'PHR-003', 'DRG-008', 2000, 10000, 14);

  return transactions;
}

export const INVENTORY_DATA = [
  { nodeId: 'PHR-001', batchId: 'BAT-2024-001', stock: 1800, expiryDate: new Date('2026-01-15'), lowStockThreshold: 200 },
  { nodeId: 'PHR-001', batchId: 'BAT-2024-003', stock: 2200, expiryDate: new Date('2026-01-20'), lowStockThreshold: 300 },
  { nodeId: 'PHR-001', batchId: 'BAT-2024-005', stock: 1500, expiryDate: new Date('2026-02-15'), lowStockThreshold: 200 },
  { nodeId: 'PHR-001', batchId: 'BAT-2024-008', stock: 2800, expiryDate: new Date('2026-05-01'), lowStockThreshold: 300 },
  { nodeId: 'PHR-002', batchId: 'BAT-2024-001', stock: 1200, expiryDate: new Date('2026-01-15'), lowStockThreshold: 200 },
  { nodeId: 'PHR-002', batchId: 'BAT-2024-002', stock: 80, expiryDate: new Date('2026-02-01'), lowStockThreshold: 200 }, // LOW STOCK
  { nodeId: 'PHR-002', batchId: 'BAT-2024-004', stock: 2800, expiryDate: new Date('2025-09-10'), lowStockThreshold: 300 }, // EXPIRING SOON
  { nodeId: 'PHR-003', batchId: 'BAT-2024-001', stock: 1300, expiryDate: new Date('2026-01-15'), lowStockThreshold: 200 },
  { nodeId: 'PHR-003', batchId: 'BAT-2024-003', stock: 2300, expiryDate: new Date('2026-01-20'), lowStockThreshold: 300 },
  { nodeId: 'PHR-003', batchId: 'BAT-2024-005', stock: 1800, expiryDate: new Date('2026-02-15'), lowStockThreshold: 200 },
  { nodeId: 'PHR-003', batchId: 'BAT-2024-006', stock: 2700, expiryDate: new Date('2026-04-01'), lowStockThreshold: 300 },
  { nodeId: 'DST-001', batchId: 'BAT-2024-001', stock: 500, expiryDate: new Date('2026-01-15'), lowStockThreshold: 1000 }, // LOW STOCK
  { nodeId: 'DST-001', batchId: 'BAT-2024-006', stock: 2500, expiryDate: new Date('2026-04-01'), lowStockThreshold: 500 },
  { nodeId: 'DST-002', batchId: 'BAT-2024-002', stock: 500, expiryDate: new Date('2026-02-01'), lowStockThreshold: 500 },
  { nodeId: 'DST-003', batchId: 'BAT-2024-005', stock: 4000, expiryDate: new Date('2026-02-15'), lowStockThreshold: 1000 },
];
