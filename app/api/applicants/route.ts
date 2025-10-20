import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { connectDB } from "@/lib/mongodb";
import Applicant from "@/models/Applicant";
import Log from "@/models/Log";

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    await connectDB();

    const formData = await request.formData();
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const passportNumber = formData.get("passportNumber") as string;
    const passportExpiry = formData.get("passportExpiry") as string;
    const passportIssuePlace = formData.get("passportIssuePlace") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;
    const nationality = formData.get("nationality") as string;
    const gender = formData.get("gender") as string;
    const maritalStatus = formData.get("maritalStatus") as string;
    const address = formData.get("address") as string;
    const emergencyContact = formData.get("emergencyContact") as string;
    const emergencyPhone = formData.get("emergencyPhone") as string;
    const destinationCountry = formData.get("destinationCountry") as string;
    const jobPosition = formData.get("jobPosition") as string;
    const medicalHistory = formData.get("medicalHistory") as string || "";

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !passportNumber || 
        !passportExpiry || !passportIssuePlace || !dateOfBirth || !nationality || 
        !gender || !maritalStatus || !address || !emergencyContact || 
        !emergencyPhone || !destinationCountry || !jobPosition) {
      
      await Log.create({
        logId: uuidv4(),
        action: "APPLICANT_CREATION_FAILED",
        userRole: "system",
        userAgent,
        details: {
          error: "Missing required fields",
          receivedFields: {
            firstName: !!firstName,
            lastName: !!lastName,
            email: !!email,
            phone: !!phone,
            passportNumber: !!passportNumber,
            passportExpiry: !!passportExpiry,
            passportIssuePlace: !!passportIssuePlace,
            dateOfBirth: !!dateOfBirth,
            nationality: !!nationality,
            gender: !!gender,
            maritalStatus: !!maritalStatus,
            address: !!address,
            emergencyContact: !!emergencyContact,
            emergencyPhone: !!emergencyPhone,
            destinationCountry: !!destinationCountry,
            jobPosition: !!jobPosition,
          }
        }
      });

      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    const applicantData = {
      applicantId: `APP-${uuidv4().substring(0, 8).toUpperCase()}`,
      firstName,
      lastName,
      email,
      phone,
      passportNumber,
      passportExpiry: new Date(passportExpiry),
      passportIssuePlace,
      dateOfBirth: new Date(dateOfBirth),
      nationality,
      gender,
      maritalStatus,
      address,
      emergencyContact,
      emergencyPhone,
      destinationCountry,
      jobPosition,
      medicalHistory,
      status: "pending",
      paymentStatus: "pending",
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
        jobPosition: applicant.jobPosition,
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