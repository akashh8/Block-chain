import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  txId: string;
  batchId: string;
  fromNode: string;
  toNode: string;
  drugId: string;
  quantity: number;
  volume: number;
  timestamp: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    txId: { type: String, required: true, unique: true, index: true },
    batchId: { type: String, required: true, index: true },
    fromNode: { type: String, required: true, index: true },
    toNode: { type: String, required: true, index: true },
    drugId: { type: String, required: true },
    quantity: { type: Number, required: true },
    volume: { type: Number, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

TransactionSchema.index({ fromNode: 1, toNode: 1 });
TransactionSchema.index({ batchId: 1, timestamp: 1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
