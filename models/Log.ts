import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ILog extends Document {
  _id: Types.ObjectId;
  logId: string;
  action: string;
  userId?: Types.ObjectId;
  userRole: string;
  userAgent: string;
  details: any;
  timestamp: Date;
}

const logSchema = new Schema<ILog>(
  {
    logId: { type: String, required: true, unique: true, index: true },
    action: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User"},
    userRole: { type: String, required: true, index: true },
    userAgent: String,
    details: Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

const Log: Model<ILog> = mongoose.models.Log || mongoose.model<ILog>("Log", logSchema);
export default Log;