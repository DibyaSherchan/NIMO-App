import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Applicant from "@/models/Applicant";
import Log from "@/models/Log";
import { v4 as uuidv4 } from "uuid";

interface UpdateData {
  status?: string;
  rejectionReason?: string | null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    if (!id) {
      return NextResponse.json({ error: "Applicant ID is required" }, { status: 400 });
    }

    await connectDB();

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: "Invalid applicant ID format" }, { status: 400 });
    }

    const body = await request.json();
    const { status, rejectionReason } = body;

    if (!status && rejectionReason === undefined) {
      return NextResponse.json(
        { error: "Either status or rejectionReason must be provided" },
        { status: 400 }
      );
    }

    if (status && !["pending", "approved", "rejected", "under_review"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const applicant = await Applicant.findById(id);
    if (!applicant) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    const previousStatus = applicant.status;
    const updateData: UpdateData = {};
    if (status) updateData.status = status;
    if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;

    const updatedApplicant = await Applicant.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    try {
      await Log.create({
        logId: uuidv4(),
        action: status === "rejected" ? "APPLICANT_REJECTED" : "APPLICANT_STATUS_UPDATED",
        userRole: "medical_staff",
        userAgent,
        details: {
          applicantId: updatedApplicant.applicantId,
          previousStatus,
          newStatus: status || previousStatus,
          rejectionReason: rejectionReason || null,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logError) {
      console.error("Failed to create log:", logError);
    }

    return NextResponse.json(
      {
        message: "Applicant updated successfully",
        applicant: {
          id: updatedApplicant._id,
          applicantId: updatedApplicant.applicantId,
          status: updatedApplicant.status,
          rejectionReason: updatedApplicant.rejectionReason,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Update applicant error:", errorMessage);

    try {
      await Log.create({
        logId: uuidv4(),
        action: "APPLICANT_UPDATE_FAILED",
        userRole: "medical_staff",
        userAgent,
        details: {
          applicantId: id || "unknown",
          error: errorMessage,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logError) {
      console.error("Failed to create error log:", logError);
    }

    return NextResponse.json({ error: "Failed to update applicant" }, { status: 500 });
  }
}
