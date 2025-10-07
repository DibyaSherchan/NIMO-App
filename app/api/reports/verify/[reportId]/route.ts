import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MedicalReport from "@/models/MedicalReport";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    await connectDB();
    
    const { reportId } = await params;
    
    if (!reportId) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );
    }

    const report = await MedicalReport.findOne({ reportId });
    
    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }
    const examinationDate = new Date(report.examinationDate);
    const twoMonthsLater = new Date(examinationDate);
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
    const isValid = new Date() <= twoMonthsLater && report.status === "approved";
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
      isValid,
      validUntil: twoMonthsLater.toISOString(),
      documentHash: report.documentHash,
    });
  } catch (error) {
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