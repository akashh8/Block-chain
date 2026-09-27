import mongoose, { Schema, Document } from 'mongoose';

export interface IBatch extends Document {
  batchId: string;
  drugName: string;
  manufacturer: string;
  manufactureDate: Date;
  expiryDate: Date;
  currentHolder: string;
  status: 'active' | 'recalled' | 'expired';
  quantity: number;
  qrPayload: string;
}

const BatchSchema = new Schema<IBatch>(
  {
    batchId: { type: String, required: true, unique: true, index: true },
    drugName: { type: String, required: true },
    manufacturer: { type: String, required: true },
    manufactureDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    currentHolder: { type: String, required: true },
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'recalled', 'expired'],
      index: true,
    },
    quantity: { type: Number, required: true },
    qrPayload: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IBatch>('Batch', BatchSchema);
