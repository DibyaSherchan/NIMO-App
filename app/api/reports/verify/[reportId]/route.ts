import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MedicalReport from "@/models/MedicalReport";

/**
 * GET endpoint for verifying a medical report's validity
 * Checks if report is approved and within 2-month validity period
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    // Connect to the database
    await connectDB();
    
    // Extract report ID from route parameters
    const { reportId } = await params;
    
    // Validate that report ID was provided
    if (!reportId) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );
    }

    // Find the report in the database
    const report = await MedicalReport.findOne({ reportId });
    
    // Handle case where report is not found
    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }
    
    // Calculate validity period (2 months from examination date)
    const examinationDate = new Date(report.examinationDate);
    const twoMonthsLater = new Date(examinationDate);
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
    
    // Check if report is currently valid
    const isValid = new Date() <= twoMonthsLater && report.status === "approved";
    
    // Return report verification details
    return NextResponse.json({
      reportId: report.reportId,
      name: report.name,
      passportNo: report.passportNo,
      examinationDate: report.examinationDate,
      destination: report.destination,
      status: report.status,
      physicianName: report.physicianName,
      physicianLicense: report.physicianLicense,
      createdAt: report.createdAt,
      isValid, // True if report is approved and within validity period
      validUntil: twoMonthsLater.toISOString(), // Expiration date
      documentHash: report.documentHash, // For additional security verification
    });
  } catch (error) {
    // Log and handle any errors during report verification
    console.error("Error verifying report:", error);
    return NextResponse.json(
      { 
        error: "Failed to verify report", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}