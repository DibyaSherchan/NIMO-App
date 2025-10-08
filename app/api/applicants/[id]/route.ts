import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Applicant from "@/models/Applicant";
import Log from "@/models/Log";
import { v4 as uuidv4 } from "uuid";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  const { id } = context.params;
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    await connectDB();

    const body = await request.json();
    const { status, rejectionReason } = body;
    const applicant = await Applicant.findById(id);

    if (!applicant) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 }
      );
    }

    if (status) {
      applicant.status = status;
    }

    if (rejectionReason !== undefined) {
      applicant.rejectionReason = rejectionReason;
    }

    await applicant.save();

    await Log.create({
      logId: uuidv4(),
      action:
        status === "rejected"
          ? "APPLICANT_REJECTED"
          : "APPLICANT_STATUS_UPDATED",
      userRole: "medical_staff",
      userAgent,
      details: {
        applicantId: applicant.applicantId,
        previousStatus: applicant.status,
        newStatus: status,
        rejectionReason: rejectionReason || null,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      {
        message: "Applicant updated successfully",
        applicant,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Update applicant error:", error);

    await Log.create({
      logId: uuidv4(),
      action: "APPLICANT_UPDATE_FAILED",
      userRole: "medical_staff",
      userAgent,
      details: {
        applicantId: id,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json(
      { error: "Failed to update applicant" },
      { status: 500 }
    );
  }
}
