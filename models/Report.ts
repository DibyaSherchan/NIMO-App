import mongoose, { Schema, Document } from "mongoose";

export interface IReport extends Document {
  reportId: string;
  applicantId: string;
  name: string;
  age: string;
  sex: string;
  passportNo: string;
  passportExpiry: string;
  examinationDate: string;
  destination: string;
  nationality: string;
  physicianName: string;
  physicianLicense: string;
  status: string;
  pdfUrl?: string;
  labResults?: Record<string, any>;
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>({
  reportId: { type: String, required: true, unique: true },
  applicantId: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: String, required: true },
  sex: { type: String, required: true },
  passportNo: { type: String, required: true },
  passportExpiry: { type: String, required: true },
  examinationDate: { type: String, required: true },
  destination: { type: String, required: true },
  nationality: { type: String, required: true },
  physicianName: { type: String, required: true },
  physicianLicense: { type: String, required: true },
  status: { type: String, default: "approved" },
  pdfUrl: { type: String },
  labResults: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);