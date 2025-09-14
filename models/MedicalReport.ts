import mongoose, { Schema, Document } from "mongoose";

export interface IMedicalReport extends Document {
  reportId: string;
  applicantId: string;
  reportType: string;
  testResults: Record<string, any>;
  doctorRemarks: string;
  physicalExamination: {
    height: string;
    weight: string;
    bloodPressure: string;
    pulse: string;
    temperature: string;
  };
  specialTests: {
    chestXRay: string;
    ecg: string;
    vision: string;
    hearing: string;
    urineTest: string;
    stoolTest: string;
    pregnancyTest: string;
  };
  vaccinationStatus: string;
  pdfData: string;
  createdAt: Date;
}

const MedicalReportSchema: Schema = new Schema({
  reportId: { type: String, required: true, unique: true, index: true },
  applicantId: { type: String, required: true },
  reportType: { type: String, required: true },
  testResults: { type: Map, of: Schema.Types.Mixed },
  doctorRemarks: { type: String },
  physicalExamination: {
    height: String,
    weight: String,
    bloodPressure: String,
    pulse: String,
    temperature: String,
  },
  specialTests: {
    chestXRay: String,
    ecg: String,
    vision: String,
    hearing: String,
    urineTest: String,
    stoolTest: String,
    pregnancyTest: String,
  },
  vaccinationStatus: String,
  pdfData: String, // Store PDF as base64 string
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.MedicalReport || 
  mongoose.model<IMedicalReport>("MedicalReport", MedicalReportSchema);