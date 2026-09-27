import mongoose, { Schema, Document } from 'mongoose';

export interface INode extends Document {
  nodeId: string;
  name: string;
  role: 'manufacturer' | 'distributor' | 'pharmacy' | 'regulator';
  reputation: number;
  ewmaReputation: number;
  status: 'Trusted' | 'Warning' | 'Quarantine' | 'Slashed';
  centralities: {
    degree: number;
    betweenness: number;
    closeness: number;
    eigenvector: number;
  };
  latestScores: {
    rf: number;
    isolation: number;
    graph: number;
    final: number;
  };
  totalTransactions: number;
  successfulTransactions: number;
}

const NodeSchema = new Schema<INode>(
  {
    nodeId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['manufacturer', 'distributor', 'pharmacy', 'regulator'],
    },
    reputation: { type: Number, default: 0.5 },
    ewmaReputation: { type: Number, default: 0.5 },
    status: {
      type: String,
      default: 'Trusted',
      enum: ['Trusted', 'Warning', 'Quarantine', 'Slashed'],
      index: true,
    },
    centralities: {
      degree: { type: Number, default: 0 },
      betweenness: { type: Number, default: 0 },
      closeness: { type: Number, default: 0 },
      eigenvector: { type: Number, default: 0 },
    },
    latestScores: {
      rf: { type: Number, default: 0 },
      isolation: { type: Number, default: 0 },
      graph: { type: Number, default: 0 },
      final: { type: Number, default: 0 },
    },
    totalTransactions: { type: Number, default: 0 },
    successfulTransactions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<INode>('Node', NodeSchema);
