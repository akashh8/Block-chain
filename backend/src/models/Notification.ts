import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  type: 'transfer' | 'suspicious' | 'quarantine' | 'recall' | 'inventory' | 'slash';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  nodeId?: string;
  batchId?: string;
  read: boolean;
  timestamp: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      required: true,
      enum: ['transfer', 'suspicious', 'quarantine', 'recall', 'inventory', 'slash'],
      index: true,
    },
    message: { type: String, required: true },
    severity: {
      type: String,
      required: true,
      enum: ['info', 'warning', 'critical'],
    },
    nodeId: { type: String, index: true },
    batchId: { type: String },
    read: { type: Boolean, default: false, index: true },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

NotificationSchema.index({ read: 1, timestamp: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
