// app/api/employee/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

import { connectDB } from "@/lib/mongodb";
import Applicant from "@/models/Applicant";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user || user.role !== "ForeignEmployee") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type");
    const applicantId = searchParams.get("id");

    if (!type || !applicantId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Fetch applicant and verify ownership
    const applicant = await Applicant.findOne({
      email: session.user.email,
      applicantId: applicantId,
    });

    if (!applicant) {
      return NextResponse.json(
        { error: "Application not found or access denied" },
        { status: 404 }
      );
    }

    let documentData: string | null = null;
    let filename = "";

    // Get the appropriate document based on type
    switch (type) {
      case "medical":
        documentData = applicant.medicalReport;
        filename = `medical_report_${applicantId}.pdf`;
        break;
      case "passport":
        documentData = applicant.passportScan;
        filename = `passport_scan_${applicantId}.pdf`;
        break;
      case "biometric":
        documentData = applicant.biometricData;
        filename = `biometric_data_${applicantId}.pdf`;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid document type" },
          { status: 400 }
        );
    }

    if (!documentData) {
      return NextResponse.json(
        { error: "Document not available" },
        { status: 404 }
      );
    }

    // If the document is stored as base64 or encrypted string
    // You may need to decode/decrypt it here based on your storage method
    
    // Example: If stored as base64
    let buffer: Buffer;
    try {
      // Remove data URI prefix if present (e.g., "data:application/pdf;base64,")
      const base64Data = documentData.replace(/^data:.*?;base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
    } catch (error) {
      console.error("Error decoding document:", error);
      return NextResponse.json(
        { error: "Error processing document" },
        { status: 500 }
      );
    }

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(buffer);
    
    // Return the file as a download
    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}