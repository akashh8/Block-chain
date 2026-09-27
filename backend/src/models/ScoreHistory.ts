import mongoose, { Schema, Document } from 'mongoose';

export interface IScoreHistory extends Document {
  nodeId: string;
  batchId: string;
  rf: number;
  isolation: number;
  graph: number;
  final: number;
  status: 'Trusted' | 'Warning' | 'Quarantine' | 'Slashed';
  timestamp: Date;
}

const ScoreHistorySchema = new Schema<IScoreHistory>(
  {
    nodeId: { type: String, required: true, index: true },
    batchId: { type: String, required: true },
    rf: { type: Number, required: true },
    isolation: { type: Number, required: true },
    graph: { type: Number, required: true },
    final: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ['Trusted', 'Warning', 'Quarantine', 'Slashed'],
    },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

ScoreHistorySchema.index({ nodeId: 1, timestamp: -1 });

export default mongoose.model<IScoreHistory>('ScoreHistory', ScoreHistorySchema);
