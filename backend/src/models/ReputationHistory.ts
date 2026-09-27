import mongoose, { Schema, Document } from 'mongoose';

export interface IReputationHistory extends Document {
  nodeId: string;
  timestamp: Date;
  reputation: number;
  ewma: number;
}

const ReputationHistorySchema = new Schema<IReputationHistory>(
  {
    nodeId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, default: Date.now },
    reputation: { type: Number, required: true },
    ewma: { type: Number, required: true },
  },
  { timestamps: true }
);

ReputationHistorySchema.index({ nodeId: 1, timestamp: -1 });

export default mongoose.model<IReputationHistory>('ReputationHistory', ReputationHistorySchema);
