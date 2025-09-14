import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IApplicant extends Document {
  _id: Types.ObjectId;
  applicantId: string;
  userId: Types.ObjectId;
  passportNumber: string;
  fullName: string;
  dateOfBirth: Date;
  nationality: string;
  gender: "Male" | "Female" | "Other";
  contactNumber: string;
  email: string;
  biometricData?: {
    fingerprint: string;
    photo: string;
  };
  medicalHistory: Array<{
    testType: string;
    result: string;
    date: Date;
    conductedBy: string;
  }>;
  applicationStatus: "Pending" | "UnderReview" | "Approved" | "Rejected" | "Completed";
  statusHistory: Array<{
    status: string;
    changedBy: Types.ObjectId;
    changedAt: Date;
    notes: string;
  }>;
  assignedAgent?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const applicantSchema = new Schema<IApplicant>(
  {
    applicantId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    passportNumber: { type: String, required: true, index: true },
    fullName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    nationality: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true },
    biometricData: {
      fingerprint: String,
      photo: String
    },
    medicalHistory: [{
      testType: String,
      result: String,
      date: Date,
      conductedBy: String
    }],
    applicationStatus: {
      type: String,
      enum: ["Pending", "UnderReview", "Approved", "Rejected", "Completed"],
      default: "Pending",
      index: true
    },
    statusHistory: [{
      status: String,
      changedBy: { type: Schema.Types.ObjectId, ref: "User" },
      changedAt: { type: Date, default: Date.now },
      notes: String
    }],
    assignedAgent: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

const Applicant: Model<IApplicant> = mongoose.models.Applicant || mongoose.model<IApplicant>("Applicant", applicantSchema);
export default Applicant;