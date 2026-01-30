import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Applicant from "@/models/Applicant";
import User from "@/models/User";
import Log from "@/models/Log";
 

export async function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    await connectDB();
    const session = await auth();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    const applications = await Applicant.find(
      { registeredBy: user.email },
      "-__v"
    ).sort({ createdAt: -1 });
    
    await Log.create({
      logId: uuidv4(),
      action: "EMPLOYEE_APPLICATIONS_FETCHED",
      userRole: user.role,
      userAgent,
      details: {
        count: applications.length,
        userEmail: user.email,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({ 
      applications,
      count: applications.length 
    }, { status: 200 });
  } catch (error: unknown) {
    console.error("Fetch applications error:", error);
    await Log.create({
      logId: uuidv4(),
      action: "EMPLOYEE_APPLICATIONS_FETCH_FAILED",
      userRole: "system",
      userAgent,
      details: {
        error: error instanceof Error ? error.message : "Unknown error"
      }
    });

    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}