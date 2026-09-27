import mongoose, { Schema, Document } from 'mongoose';

export interface IBlock extends Document {
  blockNumber: number;
  hash: string;
  previousHash: string;
  timestamp: Date;
  transactions: string[];
  transactionCount: number;
  merkleRoot: string;
  sealer: string;
}

const BlockSchema = new Schema<IBlock>(
  {
    blockNumber: { type: Number, required: true, unique: true, index: true },
    hash: { type: String, required: true, unique: true, index: true },
    previousHash: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    transactions: [{ type: String }],
    transactionCount: { type: Number, default: 0 },
    merkleRoot: { type: String, default: '' },
    sealer: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IBlock>('Block', BlockSchema);
