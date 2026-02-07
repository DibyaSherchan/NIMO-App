import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Applicant from "@/models/Applicant";
import User from "@/models/User";
import Log from "@/models/Log";

/**
 * Fetch all applications submitted by the currently logged-in foreign employee.
 * Access is restricted to authenticated users only.
 */
export async function GET(request: NextRequest) {
  // Capture user-agent for logging and audit trail
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    // Ensure database connection
    await connectDB();

    // Validate active session
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user from database
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Retrieve applications registered by this user
    const applications = await Applicant.find(
      { registeredBy: user.email },
      "-__v" // Exclude internal version field
    ).sort({ createdAt: -1 }); // Latest first

    // Log successful fetch action
    await Log.create({
      logId: uuidv4(),
      action: "EMPLOYEE_APPLICATIONS_FETCHED",
      userRole: user.role,
      userAgent,
      details: {
        count: applications.length,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
      },
    });

    // Return applications and total count
    return NextResponse.json(
      {
        applications,
        count: applications.length,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Log unexpected errors
    console.error("Fetch applications error:", error);

    await Log.create({
      logId: uuidv4(),
      action: "EMPLOYEE_APPLICATIONS_FETCH_FAILED",
      userRole: "system",
      userAgent,
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
