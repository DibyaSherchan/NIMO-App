import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MedicalReport from "@/models/MedicalReport";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("reportId");

    if (!reportId) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const report = await MedicalReport.findOne({ reportId });

    if (!report || !report.pdfData) {
      return NextResponse.json(
        { error: "Report not found or PDF data missing" },
        { status: 404 }
      );
    }

    let pdfData: string;
    if (report.pdfData.startsWith('data:application/pdf;base64,')) {
      pdfData = report.pdfData.replace(/^data:application\/pdf;base64,/, "");
    } else {
      pdfData = report.pdfData;
    }
    const binaryString = Buffer.from(pdfData, 'base64');

    return new Response(binaryString, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="medical-report-${reportId}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error viewing report:", error);
    return NextResponse.json(
      { error: "Failed to retrieve report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}