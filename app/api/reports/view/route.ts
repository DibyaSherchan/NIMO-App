import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MedicalReport from "@/models/MedicalReport";

/**
 * GET endpoint for retrieving a medical report PDF
 * Returns the PDF file for viewing or downloading
 */
export async function GET(request: NextRequest) {
  try {
    // Extract report ID from query parameters
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("reportId");

    // Validate that report ID was provided
    if (!reportId) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectDB();
    
    // Find the report and its PDF data
    const report = await MedicalReport.findOne({ reportId });

    // Handle cases where report or PDF data is missing
    if (!report || !report.pdfData) {
      return NextResponse.json(
        { error: "Report not found or PDF data missing" },
        { status: 404 }
      );
    }

    // Process the PDF data (handles both base64 and data URL formats)
    let pdfData: string;
    if (report.pdfData.startsWith('data:application/pdf;base64,')) {
      // Remove the data URL prefix to get pure base64
      pdfData = report.pdfData.replace(/^data:application\/pdf;base64,/, "");
    } else {
      // Assume it's already plain base64
      pdfData = report.pdfData;
    }
    
    // Convert base64 string to binary buffer
    const binaryString = Buffer.from(pdfData, 'base64');

    // Return the PDF as a binary response with appropriate headers
    return new Response(binaryString, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf", // Tell browser it's a PDF
        "Content-Disposition": `inline; filename="medical-report-${reportId}.pdf"`, // Display in browser
        "Cache-Control": "no-cache", // Prevent caching for fresh data
      },
    });
  } catch (error) {
    // Log and handle any errors during PDF retrieval
    console.error("Error viewing report:", error);
    return NextResponse.json(
      { 
        error: "Failed to retrieve report", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}