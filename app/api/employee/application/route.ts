import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; 
import { connectDB } from "@/lib/mongodb";
import Applicant from "@/models/Applicant";
import User from "@/models/User"; 

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }
    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user || user.role !== "ForeignEmployee") {
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
          medicalReport: applicant.medicalReport ? "available" : "",
          passportScan: applicant.passportScan ? "available" : "",
          biometricData: applicant.biometricData ? "available" : "",
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
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
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
    const applicant = await Applicant.findOne({ email: session.user.email });

    if (!applicant) {
      return NextResponse.json(
        { error: "No application found." },
        { status: 404 }
      );
    }
    if (phone) applicant.phone = phone;
    if (address) applicant.address = address;

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
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}