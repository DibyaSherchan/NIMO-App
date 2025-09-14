import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IAppointment extends Document {
  _id: Types.ObjectId;
  appointmentId: string;
  applicantId: Types.ObjectId;
  type: "MedicalExamination" | "DocumentVerification" | "Interview";
  scheduledDate: Date;
  scheduledTime: string;
  duration: number; // in minutes
  status: "Scheduled" | "Completed" | "Cancelled" | "NoShow";
  assignedTo: Types.ObjectId;
  location: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    appointmentId: { type: String, required: true, unique: true, index: true },
    applicantId: { type: Schema.Types.ObjectId, ref: "Applicant", required: true },
    type: {
      type: String,
      enum: ["MedicalExamination", "DocumentVerification", "Interview"],
      required: true
    },
    scheduledDate: { type: Date, required: true, index: true },
    scheduledTime: { type: String, required: true },
    duration: { type: Number, default: 30 }, // 30 minutes default
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled", "NoShow"],
      default: "Scheduled",
      index: true
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    location: String,
    notes: String
  },
  { timestamps: true }
);

const Appointment: Model<IAppointment> = mongoose.models.Appointment || mongoose.model<IAppointment>("Appointment", appointmentSchema);
export default Appointment;