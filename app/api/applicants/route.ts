import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Applicant from "@/models/Applicant";
import Log from "@/models/Log";
import { v4 as uuidv4 } from "uuid";
export async function POST(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    await connectDB();

    const formData = await request.formData();
    const applicantData = {
      applicantId: `APP-${uuidv4().substring(0, 8).toUpperCase()}`,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      passportNumber: formData.get("passportNumber") as string,
      passportExpiry: new Date(formData.get("passportExpiry") as string),
      dateOfBirth: new Date(formData.get("dateOfBirth") as string),
      nationality: formData.get("nationality") as string,
      gender: formData.get("gender") as string,
      address: formData.get("address") as string,
      destinationCountry: formData.get("destinationCountry") as string,
      medicalHistory: (formData.get("medicalHistory") as string) || "",
    };

    const applicant = new Applicant(applicantData);
    await applicant.save();
    await Log.create({
      logId: uuidv4(),
      action: "APPLICANT_CREATED",
      userRole: "system",
      userAgent,
      details: {
        applicantId: applicant.applicantId,
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        email: applicant.email,
        passportNumber: applicant.passportNumber,
        destinationCountry: applicant.destinationCountry,
        filesUploaded: {
          passportScan: !!formData.get("passportScan"),
          medicalReport: !!formData.get("medicalReport"),
          biometricData: !!formData.get("biometricData")
        }
      }
    });

    return NextResponse.json(
      {
        message: "Application submitted successfully",
        applicantId: applicant.applicantId,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);
    await Log.create({
      logId: uuidv4(),
      action: "APPLICANT_CREATION_FAILED",
      userRole: "system",
      userAgent,
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined
      }
    });

    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
export async function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    await connectDB();
    const applicants = await Applicant.find({}, "-__v").sort({ createdAt: -1 });
    await Log.create({
      logId: uuidv4(),
      action: "APPLICANTS_FETCHED",
      userRole: "system", 
      userAgent,
      details: {
        count: applicants.length,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json(applicants, { status: 200 });
  } catch (error: unknown) {
    console.error("Fetch applicants error:", error);
    await Log.create({
      logId: uuidv4(),
      action: "APPLICANTS_FETCH_FAILED",
      userRole: "system",
      userAgent,
      details: {
        error: error instanceof Error ? error.message : "Unknown error"
      }
    });

    return NextResponse.json(
      { error: "Failed to fetch applicants" },
      { status: 500 }
    );
  }
}