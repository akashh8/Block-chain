import mongoose, { Schema, Document } from 'mongoose';

export interface IInventory extends Document {
  nodeId: string;
  batchId: string;
  stock: number;
  expiryDate: Date;
  recalled: boolean;
  lowStockThreshold: number;
}

const InventorySchema = new Schema<IInventory>(
  {
    nodeId: { type: String, required: true, index: true },
    batchId: { type: String, required: true, index: true },
    stock: { type: Number, required: true, default: 0 },
    expiryDate: { type: Date, required: true },
    recalled: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, default: 50 },
  },
  { timestamps: true }
);

InventorySchema.index({ nodeId: 1, batchId: 1 }, { unique: true });

export default mongoose.model<IInventory>('Inventory', InventorySchema);
