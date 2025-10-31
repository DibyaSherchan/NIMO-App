import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Log from "@/models/Log"; 

export async function POST(request: Request) {
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const { name, email, role, region } = await request.json();
    
    if (!name || !email || !role || !region) {
      await Log.create({
        logId: crypto.randomUUID(),
        action: "USER_REGISTER_FAILURE",
        userId: null,
        userRole: "anonymous",
        userAgent,
        details: {
          reason: "MISSING_FIELDS",
          error: "Name, email, role, and region are required",
          attemptedData: { name: !!name, email: !!email, role: !!role, region: !!region }
        }
      });
      
      return NextResponse.json(
        { error: "Name, email, role, and region are required" },
        { status: 400 }
      );
    }

    if (!['ForeignEmployee', 'Agent', 'MedicalOrganization', 'Admin'].includes(role)) {
      await Log.create({
        logId: crypto.randomUUID(),
        action: "USER_REGISTER_FAILURE",
        userId: null,
        userRole: "anonymous",
        userAgent,
        details: {
          reason: "INVALID_ROLE",
          error: "Invalid role selected",
          attemptedRole: role
        }
      });
      
      return NextResponse.json(
        { error: "Invalid role selected" },
        { status: 400 }
      );
    }

    const validRegions = ["Central", "Eastern", "Western"];
    if (!validRegions.includes(region)) {
      await Log.create({
        logId: crypto.randomUUID(),
        action: "USER_REGISTER_FAILURE",
        userId: null,
        userRole: "anonymous",
        userAgent,
        details: {
          reason: "INVALID_REGION",
          error: "Invalid region specified",
          attemptedRegion: region
        }
      });
      
      return NextResponse.json(
        { error: "Invalid region specified" },
        { status: 400 }
      );
    }

    await connectDB();
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      await Log.create({
        logId: crypto.randomUUID(),
        action: "USER_REGISTER_FAILURE",
        userId: null,
        userRole: "anonymous",
        userAgent,
        details: {
          reason: "DUPLICATE_EMAIL",
          error: "User with this email already exists",
          attemptedEmail: email.toLowerCase()
        }
      });
      
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }
    
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      role,
      region,
      authProvider: 'google',
      password: null,
      isActive: true,
    });

    await user.save();
    await Log.create({
      logId: crypto.randomUUID(),
      action: "USER_REGISTER_SUCCESS",
      userId: user._id,
      userRole: user.role,
      userAgent,
      details: {
        email: user.email,
        registrationMethod: "google_oauth",
        assignedRole: user.role,
        region: user.region,
        authProvider: "google"
      }
    });

    return NextResponse.json(
      { 
        message: "Account created successfully",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          region: user.region
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Google registration error:", error);
    await Log.create({
      logId: crypto.randomUUID(),
      action: "USER_REGISTER_FAILURE",
      userId: null,
      userRole: "anonymous",
      userAgent,
      details: {
        reason: "SERVER_ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
        registrationMethod: "google_oauth",
        errorStack: error instanceof Error ? error.stack : undefined
      }
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}