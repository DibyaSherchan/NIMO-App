import mongoose, { Document, Schema } from "mongoose";
import crypto from "crypto";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 10);
const ENC_SECRET =
  process.env.ENCRYPTION_SECRET || "default_secret_key_32_characters";
const ENC_ALGO = "aes-256-cbc";
const IV_LENGTH = 16;

function encrypt(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENC_SECRET.padEnd(32, "0").substring(0, 32));
  const cipher = crypto.createCipheriv(ENC_ALGO, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text: string): string {
  if (!text) return "";
  try {
    if (text.includes(":")) {
      const textParts = text.split(":");
      if (textParts.length === 2) {
        const iv = Buffer.from(textParts[0], "hex");
        const encryptedText = textParts[1];
        const key = Buffer.from(ENC_SECRET.padEnd(32, "0").substring(0, 32));
        const decipher = crypto.createDecipheriv(ENC_ALGO, key, iv);
        let decrypted = decipher.update(encryptedText, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
      }
    }
    return text;
  } catch (error) {
    console.warn("Decryption failed, returning original text");
    return text;
  }
}

export interface IApplicant extends Document {
  applicantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passportNumber: string;
  passportExpiry: Date;
  passportIssuePlace: string;
  dateOfBirth: Date;
  nationality: string;
  gender: string;
  maritalStatus: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  destinationCountry: string;
  jobPosition: string;
  medicalHistory: string;
  biometricData: string;
  passportScan: string;
  medicalReport: string;
  status: string;
  rejectionReason?: string;
  paymentMethod?: string;
  paymentStatus: string;
  paymentProof?: string;
  paymentVerifiedAt?: Date;
  region: string;
  registeredBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicantSchema: Schema<IApplicant> = new Schema(
  {
    applicantId: {
      type: String,
      unique: true,
      index: true,
      default: () => nanoid(),
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
      type: String,
      required: true,
    },
    phone: { type: String, required: true },
    passportNumber: {
      type: String,
      required: true,
      index: true, 
      get: decrypt,
      set: encrypt,
    },
    passportExpiry: { type: Date, required: true },
    passportIssuePlace: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    nationality: { type: String, required: true },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },
    maritalStatus: {
      type: String,
      required: true,
      enum: ["Single", "Married", "Divorced", "Widowed"],
    },
    address: { type: String, required: true },
    emergencyContact: { type: String, required: true },
    emergencyPhone: { type: String, required: true },
    destinationCountry: { type: String, required: true },
    jobPosition: { type: String, required: true },
    medicalHistory: { type: String, default: "" },
    biometricData: {
      type: String,
      default: "",
      get: decrypt,
      set: encrypt,
    },
    passportScan: {
      type: String,
      default: "",
      get: decrypt,
      set: encrypt,
    },
    medicalReport: {
      type: String,
      default: "",
      get: decrypt,
      set: encrypt,
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "under_review", "verified", "approved", "rejected"],
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    paymentMethod: {
      type: String,
      enum: ["qr_phonepay", "card", "cash"],
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "pending_verification",
        "pending_reception",
        "verified",
        "completed",
      ],
      default: "pending",
    },
    paymentProof: {
      type: String,
      default: "",
      get: decrypt,
      set: encrypt,
    },
    paymentVerifiedAt: {
      type: Date,
      default: null,
    },
    region: {
      type: String,
      required: true,
      enum: ["Central", "Eastern", "Western"],
      index: true,
    },
    registeredBy: {
      type: String,
      default: "",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);
ApplicantSchema.index(
  {
    email: 1,
    passportNumber: 1,
    destinationCountry: 1,
    jobPosition: 1,
    region: 1,
    createdAt: 1,
  },
  {
    name: "application_tracking",
  }
);
ApplicantSchema.index({ region: 1, status: 1 });

export default mongoose.models.Applicant ||
  mongoose.model<IApplicant>("Applicant", ApplicantSchema);