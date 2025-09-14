import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Applicant from "@/models/Applicant";
import { v4 as uuidv4 } from "uuid";

// Create new applicant
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();

    // Basic applicant information
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

    return NextResponse.json(
      {
        message: "Application submitted successfully",
        applicantId: applicant.applicantId,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { status: 500 }
    );
  }
}

// Retrieve applicants (for Medical Dashboard)
export async function GET() {
  try {
    await connectDB();
    const applicants = await Applicant.find({}, "-__v").sort({ createdAt: -1 });

    return NextResponse.json(applicants, { status: 200 });
  } catch (error: unknown) {
    console.error("Fetch applicants error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applicants" },
      { status: 500 }
    );
  }
}
