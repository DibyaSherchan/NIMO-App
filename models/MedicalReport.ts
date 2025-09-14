import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IMedicalReport extends Document {
  _id: Types.ObjectId;
  reportId: string;
  applicantId: Types.ObjectId;
  reportType: string;
  testResults: {
    hiv: string;
    tuberculosis: string;
    malaria: string;
    hepatitisB: string;
    hepatitisC: string;
    syphilis: string;
    // Add other tests as needed
  };
  doctorRemarks: string;
  conductedBy: Types.ObjectId;
  reportDate: Date;
  qrCode: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const medicalReportSchema = new Schema<IMedicalReport>(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    applicantId: { type: Schema.Types.ObjectId, ref: "Applicant", required: true },
    reportType: { type: String, required: true },
    testResults: {
      hiv: String,
      tuberculosis: String,
      malaria: String,
      hepatitisB: String,
      hepatitisC: String,
      syphilis: String
    },
    doctorRemarks: String,
    conductedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportDate: { type: Date, default: Date.now },
    qrCode: { type: String, required: true },
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const MedicalReport: Model<IMedicalReport> = mongoose.models.MedicalReport || mongoose.model<IMedicalReport>("MedicalReport", medicalReportSchema);
export default MedicalReport;