import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; 
import { connectDB } from "@/lib/mongodb";
import Applicant from "@/models/Applicant";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log("GET /api/employee/application - Route hit");
  
  try {
    const session = await getServerSession(authOptions);
    console.log("Session:", session?.user?.email);
    if (!session || !session.user?.email) {
      console.log("Unauthorized: No session");
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }
    await connectDB();
    console.log("Database connected");
    const user = await User.findOne({ email: session.user.email });
    console.log("User found:", user?.email, "Role:", user?.role);

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }
    if (user.role !== "ForeignEmployee") {
      return NextResponse.json(
        { error: "Access denied. Only foreign employees can access this resource." },
        { status: 403 }
      );
    }
    const applicant = await Applicant.findOne({ 
      email: session.user.email 
    }).select(
      "applicantId firstName lastName email phone destinationCountry " +
      "status medicalReport passportScan biometricData createdAt updatedAt " +
      "rejectionReason nationality dateOfBirth gender address"
    );

    console.log("Applicant found:", !!applicant);
    if (!applicant) {
      return NextResponse.json(
        { error: "No application found for this user." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: true,
        applicant: {
          applicantId: applicant.applicantId,
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          email: applicant.email,
          phone: applicant.phone,
          destinationCountry: applicant.destinationCountry,
          nationality: applicant.nationality,
          dateOfBirth: applicant.dateOfBirth,
          gender: applicant.gender,
          address: applicant.address,
          status: applicant.status,
          medicalReport: applicant.medicalReport || "",
          passportScan: applicant.passportScan || "",
          biometricData: applicant.biometricData || "",
          createdAt: applicant.createdAt,
          updatedAt: applicant.updatedAt,
          rejectionReason: applicant.rejectionReason || "",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching applicant data:", error);
    return NextResponse.json(
      { 
        error: "Internal server error. Please try again later.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  console.log("PATCH /api/employee/application - Route hit");
  
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user || user.role !== "ForeignEmployee") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { phone, address } = body;

    if (!phone && !address) {
      return NextResponse.json(
        { error: "No fields to update provided." },
        { status: 400 }
      );
    }

    const applicant = await Applicant.findOne({ email: session.user.email });

    if (!applicant) {
      return NextResponse.json(
        { error: "No application found." },
        { status: 404 }
      );
    }

    // Update fields
    if (phone) applicant.phone = phone;
    if (address) applicant.address = address;
    applicant.updatedAt = new Date();

    await applicant.save();

    return NextResponse.json(
      {
        success: true,
        message: "Application updated successfully",
        applicant: {
          applicantId: applicant.applicantId,
          phone: applicant.phone,
          address: applicant.address,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating applicant data:", error);
    return NextResponse.json(
      { 
        error: "Internal server error.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}