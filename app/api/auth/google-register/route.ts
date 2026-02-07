import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Log from "@/models/Log";

// Handles Google OAuth–based user registration
export async function POST(request: Request) {
  // Capture user-agent for audit logging
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    // Parse request payload
    const { name, email, role, region } = await request.json();

    // Validate required fields
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
          attemptedData: {
            name: !!name,
            email: !!email,
            role: !!role,
            region: !!region,
          },
        },
      });

      return NextResponse.json(
        { error: "Name, email, role, and region are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (
      !["ForeignEmployee", "Agent", "MedicalOrganization", "Admin"].includes(role)
    ) {
      await Log.create({
        logId: crypto.randomUUID(),
        action: "USER_REGISTER_FAILURE",
        userId: null,
        userRole: "anonymous",
        userAgent,
        details: {
          reason: "INVALID_ROLE",
          error: "Invalid role selected",
          attemptedRole: role,
        },
      });

      return NextResponse.json(
        { error: "Invalid role selected" },
        { status: 400 }
      );
    }

    // Validate region
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
          attemptedRegion: region,
        },
      });

      return NextResponse.json(
        { error: "Invalid region specified" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Prevent duplicate email registration
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
          attemptedEmail: email.toLowerCase(),
        },
      });

      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create new OAuth user (passwordless)
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      role,
      region,
      authProvider: "google",
      password: null,
      isActive: true,
    });

    await user.save();

    // Log successful registration
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
        authProvider: "google",
      },
    });

    // Return sanitized user response
    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          region: user.region,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Catch-all error logging
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
        errorStack: error instanceof Error ? error.stack : undefined,
      },
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
