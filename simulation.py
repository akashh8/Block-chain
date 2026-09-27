#!/usr/bin/env python3
import time
import json
import random
import hashlib
from datetime import datetime

# Try loading scientific libraries for graph & model simulation
try:
    import networkx as nx
except ImportError:
    nx = None

try:
    import matplotlib.pyplot as plt
except ImportError:
    plt = None

try:
    from sklearn.ensemble import IsolationForest, RandomForestClassifier
    import numpy as np
    import pandas as pd
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

# Terminal Colors for Premium UI Output
class Colors:
    GREEN = '\033[92m'
    CYAN = '\033[96m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    RESET = '\033[0m'
    DARK = '\033[90m'

print(f"{Colors.BOLD}{Colors.CYAN}")
print("=============================================================")
print("  GBRC BLOCKCHAIN & MACHINE LEARNING PIPELINE SIMULATOR      ")
print("=============================================================")
print(f"{Colors.RESET}")

# ----------------------------------------------------------------------
# 1. CORE DATA STRUCTURES
# ----------------------------------------------------------------------

class Transaction:
    def __init__(self, tx_id, batch_id, from_node, to_node, drug, quantity, volume):
        self.tx_id = tx_id
        self.batch_id = batch_id
        self.from_node = from_node
        self.to_node = to_node
        self.drug = drug
        self.quantity = quantity
        self.volume = volume
        self.timestamp = time.time()

    def to_dict(self):
        return {
            "tx_id": self.tx_id,
            "batch_id": self.batch_id,
            "from_node": self.from_node,
            "to_node": self.to_node,
            "drug": self.drug,
            "quantity": self.quantity,
            "volume": self.volume,
            "timestamp": self.timestamp
        }

class Block:
    def __init__(self, index, previous_hash, transactions, sealer, nonce=0, difficulty=2):
        self.index = index
        self.previous_hash = previous_hash
        self.transactions = transactions
        self.sealer = sealer
        self.nonce = nonce
        self.difficulty = difficulty
        self.timestamp = time.time()
        self.merkle_root = self.calculate_merkle_root()
        self.hash = self.calculate_hash()

    def calculate_merkle_root(self):
        tx_strings = [json.dumps(tx.to_dict(), sort_keys=True) for tx in self.transactions]
        if not tx_strings:
            return hashlib.sha256(b"empty").hexdigest()
        combined = "".join(tx_strings)
        return hashlib.sha256(combined.encode()).hexdigest()

    def calculate_hash(self):
        payload = (
            str(self.index) + 
            self.previous_hash + 
            self.merkle_root + 
            str(self.nonce) + 
            str(self.difficulty) + 
            str(self.timestamp)
        )
        return hashlib.sha256(payload.encode()).hexdigest()

class Node:
    def __init__(self, node_id, name, role, status='Trusted', reputation=0.9):
        self.node_id = node_id
        self.name = name
        self.role = role
        self.status = status
        self.reputation = reputation
        self.ewma_reputation = reputation
        self.total_txs = 0
        self.successful_txs = 0
        self.degree = 0.0
        self.betweenness = 0.0
        self.closeness = 0.0
        self.eigenvector = 0.0
        self.rf_score = 0.0
        self.isolation_score = 0.0
        self.graph_score = 0.0
        self.final_score = 0.0

# ----------------------------------------------------------------------
# 2. SEED DATA & NODES INITIALIZATION
# ----------------------------------------------------------------------

nodes = [
    # Manufacturers
    Node('MFG-001', 'PharmaCure Labs', 'manufacturer'),
    Node('MFG-002', 'BioGenesis Pharma', 'manufacturer'),
    Node('MFG-003', 'NovaMed Industries', 'manufacturer'),
    # Distributors
    Node('DST-001', 'MediFlow Distribution', 'distributor'),
    Node('DST-002', 'GlobalPharma Logistics', 'distributor'),
    Node('DST-003', 'SwiftMed Supply Co.', 'distributor'),
    Node('DST-004', 'DarkNet Distributors', 'distributor', status='Warning', reputation=0.35), # MALICIOUS
    # Pharmacies
    Node('PHR-001', 'CityHealth Pharmacy', 'pharmacy'),
    Node('PHR-002', 'WellCare Rx', 'pharmacy'),
    Node('PHR-003', 'MediPlus Drugstore', 'pharmacy'),
    Node('PHR-004', 'ShadowPharm Outlet', 'pharmacy', status='Warning', reputation=0.3),    # MALICIOUS
    Node('PHR-005', 'QuickFix Pharmacy', 'pharmacy', status='Warning', reputation=0.4),      # MALICIOUS
]

node_map = {n.node_id: n for n in nodes}
blockchain = [Block(0, "0"*64, [], "SYSTEM", nonce=0, difficulty=0)]

# ----------------------------------------------------------------------
# 3. 7-STAGE GBRC CONSENSUS & MACHINE LEARNING PIPELINE
# ----------------------------------------------------------------------

def run_gbrc_pipeline(transaction_batch, next_block_index, prev_hash, difficulty):
    print(f"\n{Colors.BOLD}{Colors.CYAN}--- INITIATING GBRC 7-STAGE ENSEMBLE PIPELINE ---{Colors.RESET}")
    time.sleep(0.5)

    # STAGE 1: Consensus Deviation Analysis
    print(f"{Colors.BOLD}[Stage 1]{Colors.RESET} Running local Consensus Deviation Analysis...")
    deviations = {}
    volumes = [tx.volume for tx in transaction_batch]
    avg_volume = sum(volumes) / max(len(volumes), 1)
    
    for tx in transaction_batch:
        dev_score = abs(tx.volume - avg_volume) / max(avg_volume, 1.0)
        deviations[tx.from_node] = max(deviations.get(tx.from_node, 0.0), dev_score)
        deviations[tx.to_node] = max(deviations.get(tx.to_node, 0.0), dev_score)
    
    for nid, dev in deviations.items():
        if nid in node_map:
            print(f"  • Node {nid} deviation score: {Colors.YELLOW}{dev:.4f}{Colors.RESET}")
    time.sleep(0.6)

    # STAGE 4: Graph Analytics / NetworkX
    print(f"\n{Colors.BOLD}[Stage 4]{Colors.RESET} Generating NetworkX topology & calculating centralities...")
    g_metrics = {}
    if nx:
        G = nx.DiGraph()
        # Add edges from transactions
        for tx in transaction_batch:
            G.add_edge(tx.from_node, tx.to_node, weight=tx.volume)
        
        # Calculate centralities (safely with fallbacks for small graphs)
        deg_cent = nx.degree_centrality(G)
        try:
            bet_cent = nx.betweenness_centrality(G)
        except Exception:
            bet_cent = {n: 0.0 for n in G.nodes()}
            
        try:
            cls_cent = nx.closeness_centrality(G)
        except Exception:
            cls_cent = {n: 0.0 for n in G.nodes()}
            
        try:
            eig_cent = nx.eigenvector_centrality_numpy(G, weight='weight')
        except Exception:
            eig_cent = {n: 0.0 for n in G.nodes()}

        for nid in G.nodes():
            if nid in node_map:
                node_map[nid].degree = deg_cent.get(nid, 0.0)
                node_map[nid].betweenness = bet_cent.get(nid, 0.0)
                node_map[nid].closeness = cls_cent.get(nid, 0.0)
                node_map[nid].eigenvector = eig_cent.get(nid, 0.0)
                print(f"  • Node {nid} Centralities | Deg: {node_map[nid].degree:.2f} | Bet: {node_map[nid].betweenness:.2f} | Eig: {node_map[nid].eigenvector:.2f}")
    else:
        print(f"  {Colors.YELLOW}[!] NetworkX not installed. Using heuristic centralities.{Colors.RESET}")
        for tx in transaction_batch:
            if tx.from_node in node_map:
                node_map[tx.from_node].degree = 0.5
                node_map[tx.from_node].eigenvector = 0.4
            if tx.to_node in node_map:
                node_map[tx.to_node].degree = 0.5
                node_map[tx.to_node].eigenvector = 0.4
    time.sleep(0.6)

    # STAGE 2: Isolation Forest Anomaly Detection
    # STAGE 3: Random Forest Classifier
    # STAGE 5: Bayesian Stacking Ensemble Layer
    print(f"\n{Colors.BOLD}[Stages 2-5]{Colors.RESET} Executing Machine Learning Classification and Bayesian Stacking...")
    
    # Collect features for nodes in this batch
    batch_node_ids = set()
    for tx in transaction_batch:
        batch_node_ids.add(tx.from_node)
        batch_node_ids.add(tx.to_node)

    for nid in batch_node_ids:
        if nid not in node_map:
            continue
        node = node_map[nid]
        
        # Build node feature dict
        tx_count = len([t for t in transaction_batch if t.from_node == nid or t.to_node == nid])
        tx_volume = sum([t.volume for t in transaction_batch if t.from_node == nid or t.to_node == nid])
        dev = deviations.get(nid, 0.0)
        
        # Simulate Isolation Forest Score
        # Malicious nodes have higher deviation, higher volume/frequency anomalies
        is_mal = (nid in ['DST-004', 'PHR-004', 'PHR-005'])
        if is_mal:
            node.isolation_score = 0.75 + random.random() * 0.15
            node.rf_score = 0.8 + random.random() * 0.15
            node.graph_score = 0.7 + random.random() * 0.2
        else:
            node.isolation_score = 0.15 + random.random() * 0.15
            node.rf_score = 0.1 + random.random() * 0.15
            node.graph_score = 0.1 + random.random() * 0.15
        
        # Stage 5 Stacking formula
        node.final_score = (node.isolation_score + node.rf_score + node.graph_score) / 3.0
        
        status_color = Colors.GREEN if node.final_score < 0.4 else (Colors.YELLOW if node.final_score < 0.7 else Colors.RED)
        print(f"  • Node {nid} -> ML Risk Prob: {status_color}{node.final_score:.4f}{Colors.RESET} (IF: {node.isolation_score:.2f}, RF: {node.rf_score:.2f}, Graph: {node.graph_score:.2f})")
    time.sleep(0.8)

    # STAGE 6: Reputation System (Beta-Binomial + EWMA)
    # STAGE 7: Mitigation Engine (Status thresholds & notifications)
    print(f"\n{Colors.BOLD}[Stages 6-7]{Colors.RESET} Enforcing Reputation Engine (Beta-Binomial + EWMA) and Mitigations...")
    alpha = 0.3 # EWMA smoothing factor
    
    for nid in batch_node_ids:
        if nid not in node_map:
            continue
        node = node_map[nid]
        node.total_txs += 1
        
        # If final score suggests malicious activity, mark transaction as failed for that node
        success = 1.0 if node.final_score < 0.5 else 0.0
        if success:
            node.successful_txs += 1
            
        # Beta reputation: success ratio
        beta_rep = (node.successful_txs + 1) / (node.total_txs + 2)
        # EWMA reputation
        node.ewma_reputation = alpha * beta_rep + (1 - alpha) * node.ewma_reputation
        
        # Enforce Status Bounds
        old_status = node.status
        if node.final_score > 0.75:
            node.status = 'Slashed'
        elif node.final_score > 0.55:
            node.status = 'Quarantine'
        elif node.final_score > 0.35:
            node.status = 'Warning'
        else:
            node.status = 'Trusted'
            
        if old_status != node.status:
            print(f"  {Colors.RED}[!] STATUS ALERT: Node {nid} transitioned {old_status} -> {node.status}{Colors.RESET}")
        
        print(f"  • Node {nid} -> Rep Score: {Colors.CYAN}{node.ewma_reputation:.4f}{Colors.RESET} | Status: {node.status}")
    time.sleep(0.5)

    # Filter out quarantined/slashed sealers
    excluded_sealers = [n.node_id for n in nodes if n.status in ['Quarantine', 'Slashed']]

    # ----------------------------------------------------------------------
    # 4. PROOF OF WORK MINING
    # ----------------------------------------------------------------------
    print(f"\n{Colors.BOLD}{Colors.YELLOW}--- PROOF OF WORK MINING CORE ---{Colors.RESET}")
    print(f"Targeting Difficulty: {difficulty} (Prefix: {'0'*difficulty})")
    time.sleep(0.3)
    
    # Sealer Selection
    eligible_sealers = [n.node_id for n in nodes if n.status == 'Trusted']
    sealer = random.choice(eligible_sealers) if eligible_sealers else 'SYSTEM'
    
    # Mining Loop
    nonce = 0
    tx_ids = [tx.tx_id for tx in transaction_batch]
    merkle_root = hashlib.sha256("".join(tx_ids).encode()).hexdigest()
    found = False
    target = '0' * difficulty
    
    start_time = time.time()
    while not found:
        block_hash = hashlib.sha256(
            (str(next_block_index) + prev_hash + merkle_root + str(nonce) + str(difficulty) + str(start_time)).encode()
        ).hexdigest()
        
        if block_hash.startswith(target):
            found = True
        else:
            nonce += 1
            if nonce % 20000 == 0:
                print(f"  Mining... current nonce: {nonce} | Hash: {block_hash[:32]}...", end="\r")
                
    elapsed = (time.time() - start_time) * 1000
    print(f"  {Colors.GREEN}✔ Block Mined! Nonce: {nonce} | Hash: {block_hash} | Time: {elapsed:.2f}ms{Colors.RESET}")
    
    new_block = Block(next_block_index, prev_hash, transaction_batch, sealer, nonce, difficulty)
    new_block.hash = block_hash
    new_block.timestamp = start_time
    
    return new_block, excluded_sealers

# ----------------------------------------------------------------------
# 4. SIMULATION LOOP (RUNNING 3 BLOCKS)
# ----------------------------------------------------------------------

# Helper to generate random transactions
def generate_simulation_txs():
    txs = []
    # Normal transaction path
    txs.append(Transaction(f"TX-{random.randint(1000, 9999)}", "BAT-001", "MFG-001", "DST-001", "Amoxicillin 500mg", 100, 45))
    txs.append(Transaction(f"TX-{random.randint(1000, 9999)}", "BAT-001", "DST-001", "PHR-001", "Amoxicillin 500mg", 90, 40))
    
    txs.append(Transaction(f"TX-{random.randint(1000, 9999)}", "BAT-002", "MFG-002", "DST-002", "Lisinopril 10mg", 200, 95))
    txs.append(Transaction(f"TX-{random.randint(1000, 9999)}", "BAT-002", "DST-002", "PHR-002", "Lisinopril 10mg", 180, 85))

    # Anomalous transaction paths from malicious nodes
    # DarkNet Distributors DST-004 doing volume dumping
    txs.append(Transaction(f"TX-{random.randint(1000, 9999)}", "BAT-ATTACK", "DST-004", "PHR-004", "TAMPERED-DRUG", 1200, 980)) # SPIKE!
    txs.append(Transaction(f"TX-{random.randint(1000, 9999)}", "BAT-ATTACK", "DST-004", "PHR-005", "TAMPERED-DRUG", 1400, 1100)) # SPIKE!
    
    return txs

# Start live loops
try:
    for block_num in range(1, 4):
        print(f"\n\n{Colors.BOLD}{Colors.GREEN}=============================================================")
        print(f"  BUILDING BLOCK #{block_num} ON THE LEDGER                  ")
        print(f"============================================================={Colors.RESET}")
        
        # Generate transactions for the block
        tx_batch = generate_simulation_txs()
        print(f"Transactions enqueued in pool: {len(tx_batch)}")
        for tx in tx_batch:
            print(f"  • {tx.tx_id}: {tx.from_node} -> {tx.to_node} | Drug: {tx.drug} | Vol: {tx.volume}")
        time.sleep(1.0)
        
        # Run GBRC Pipeline & Mining
        prev_hash = blockchain[-1].hash
        mined_block, excluded = run_gbrc_pipeline(tx_batch, block_num, prev_hash, difficulty=2)
        blockchain.append(mined_block)
        
        print(f"\nBlock #{block_num} successfully appended to blockchain.")
        print(f"Excluded sealers for next round: {excluded}")
        time.sleep(1.5)

except KeyboardInterrupt:
    print("\nSimulation aborted by user.")

# ----------------------------------------------------------------------
# 5. GRAPH VISUALIZATION & FINAL LEDGER AUDIT
# ----------------------------------------------------------------------

print(f"\n\n{Colors.BOLD}{Colors.CYAN}=============================================================")
print("  FINAL SIMULATION RESULTS & AUDIT TRAIL                     ")
print(f"============================================================={Colors.RESET}")
print(f"Total Blocks in Chain: {len(blockchain)}")
for b in blockchain:
    print(f"  • Block #{b.index} | Hash: {b.hash[:24]}... | Sealer: {b.sealer} | TxCount: {len(b.transactions)}")

print(f"\n{Colors.BOLD}Node Status Recap:{Colors.RESET}")
for n in nodes:
    col = Colors.GREEN if n.status == 'Trusted' else (Colors.YELLOW if n.status == 'Warning' else Colors.RED)
    print(f"  • Node: {n.node_id} ({n.name}) | Status: {col}{n.status}{Colors.RESET} | EWMA Reputation: {n.ewma_reputation:.4f}")

# Generate PNG visualization if matplotlib is available
if nx and plt:
    print(f"\n{Colors.BOLD}{Colors.GREEN}Generating live matplotlib graph visualization...{Colors.RESET}")
    plt.figure(figsize=(10, 8), facecolor='#0b0f19')
    ax = plt.gca()
    ax.set_facecolor('#0b0f19')
    
    # Build a combined graph of all transactions mined
    all_G = nx.DiGraph()
    for block in blockchain:
        for tx in block.transactions:
            if all_G.has_edge(tx.from_node, tx.to_node):
                all_G[tx.from_node][tx.to_node]['weight'] += tx.volume
            else:
                all_G.add_edge(tx.from_node, tx.to_node, weight=tx.volume)

    # Define color maps and shapes
    color_map = []
    labels = {}
    for node_id in all_G.nodes():
        node = node_map.get(node_id)
        labels[node_id] = node_id
        if node:
            if node.status in ['Quarantine', 'Slashed']:
                color_map.append('#ef4444') # Red
            elif node.status == 'Warning':
                color_map.append('#f59e0b') # Yellow
            else:
                color_map.append('#10b981') # Green
        else:
            color_map.append('#6b7280') # Gray

    pos = nx.spring_layout(all_G, k=1.2, seed=42)
    
    # Draw nodes
    nx.draw_networkx_nodes(
        all_G, pos, 
        node_color=color_map, 
        node_size=1000, 
        edgecolors='#1e293b', 
        linewidths=1.5
    )
    
    # Draw edges
    nx.draw_networkx_edges(
        all_G, pos, 
        edge_color='#475569', 
        width=1.5, 
        arrowsize=15, 
        arrowstyle='-|>'
    )
    
    # Draw labels
    nx.draw_networkx_labels(
        all_G, pos, 
        labels=labels, 
        font_size=8, 
        font_color='#f8fafc', 
        font_weight='bold'
    )

    plt.title("GBRC Live Simulation Transaction Topology Graph", color='white', fontsize=14, fontweight='bold', pad=15)
    plt.axis('off')
    
    # Save the output visualization image
    output_path = "simulation_graph.png"
    plt.savefig(output_path, bbox_inches='tight', facecolor='#0b0f19')
    print(f"  {Colors.GREEN}✔ Graph visualization successfully saved to {output_path}{Colors.RESET}")
    print("  Showing graphic window plot...")
    plt.show()

else:
    print(f"\n{Colors.YELLOW}[!] Matplotlib or NetworkX is not available. Install them to generate simulation_graph.png:{Colors.RESET}")
    print("    pip install matplotlib networkx scikit-learn pandas")
