import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Applicant from "@/models/Applicant";
import User from "@/models/User";
import Log from "@/models/Log";


export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    await connectDB();
    const session = await auth();

    if (!session || !session.user?.email) {
      await Log.create({
        logId: uuidv4(),
        action: "APPLICANT_CREATION_FAILED",
        userRole: "system",
        userAgent,
        details: {
          error: "Unauthorized - No active session",
        },
      });

      return NextResponse.json(
        { error: "Unauthorized. Please log in to submit an application." },
        { status: 401 }
      );
    }
    const user = await User.findOne({ email: session.user.email });

    if (!user || !user.region) {
      await Log.create({
        logId: uuidv4(),
        action: "APPLICANT_CREATION_FAILED",
        userRole: user?.role || "unknown",
        userAgent,
        details: {
          error: "User region not found",
          userEmail: session.user.email,
        },
      });

      return NextResponse.json(
        { error: "User region not found. Please contact administrator." },
        { status: 400 }
      );
    }

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
    const medicalHistory = (formData.get("medicalHistory") as string) || "";
    const existingApplicant = await Applicant.findOne({
      passportNumber: passportNumber,
    });

    if (existingApplicant) {
      await Log.create({
        logId: uuidv4(),
        action: "APPLICANT_CREATION_FAILED",
        userRole: user.role,
        userAgent,
        details: {
          error: "Duplicate passport number",
          passportNumber: passportNumber,
          region: user.region,
        },
      });

      return NextResponse.json(
        { error: "An application with this passport number already exists" },
        { status: 400 }
      );
    }
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !passportNumber ||
      !passportExpiry ||
      !passportIssuePlace ||
      !dateOfBirth ||
      !nationality ||
      !gender ||
      !maritalStatus ||
      !address ||
      !emergencyContact ||
      !emergencyPhone ||
      !destinationCountry ||
      !jobPosition
    ) {
      await Log.create({
        logId: uuidv4(),
        action: "APPLICANT_CREATION_FAILED",
        userRole: user.role,
        userAgent,
        details: {
          error: "Missing required fields",
          region: user.region,
          registeredBy: user.email,
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
          },
        },
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
      region: user.region,
      registeredBy: user.email,
    };

    const applicant = new Applicant(applicantData);
    console.log("Applicant data before save:", applicantData);
    console.log("Applicant instance region:", applicant.region);
    console.log("Applicant instance registeredBy:", applicant.registeredBy);

    await applicant.save();

    const savedApplicant = await Applicant.findById(applicant._id);
    console.log("Saved applicant from DB:", savedApplicant.toObject());

    await Log.create({
      logId: uuidv4(),
      action: "APPLICANT_CREATED",
      userRole: user.role,
      userAgent,
      details: {
        applicantId: applicant.applicantId,
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        email: applicant.email,
        passportNumber: applicant.passportNumber,
        destinationCountry: applicant.destinationCountry,
        jobPosition: applicant.jobPosition,
        region: applicant.region,
        registeredBy: applicant.registeredBy,
      },
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
        errorStack: error instanceof Error ? error.stack : undefined,
      },
    });

    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    await connectDB();
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    type ApplicantQuery = {
      region?: string;
      registeredBy?: string;
    };
    
    let query: ApplicantQuery = {};

    if (user.role === "Admin") {
      query = {};
    } else if (user.role === "Agent") {
      query = { region: user.region };
    } else if (user.role === "MedicalOrganization") {
      query = { region: user.region };
    } else if (user.role === "ForeignEmployee") {
      query = { registeredBy: user.email };
    } else {
      query = { registeredBy: user.email };
    }

    const applicants = await Applicant.find(query, "-__v").sort({
      createdAt: -1,
    });

    await Log.create({
      logId: uuidv4(),
      action: "APPLICANTS_FETCHED",
      userRole: user.role,
      userAgent,
      details: {
        count: applicants.length,
        region: user.region,
        userEmail: user.email,
        filterApplied: JSON.stringify(query),
        timestamp: new Date().toISOString(),
      },
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
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json(
      { error: "Failed to fetch applicants" },
      { status: 500 }
    );
  }
}