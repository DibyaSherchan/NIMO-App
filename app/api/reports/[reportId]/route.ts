import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MedicalReport from "@/models/MedicalReport";

/**
 * GET endpoint for retrieving a specific medical report
 * Returns the report formatted for use in frontend forms
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> } 
) {
  try {
    // Extract the report ID from route parameters
    const { reportId } = await params;
    
    // Connect to the database
    await connectDB();
    
    // Find the report by its unique identifier
    const report = await MedicalReport.findOne({ reportId });

    // Handle case where report is not found
    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Transform database structure to match frontend form format
    // This ensures compatibility between backend storage and frontend display
    const formattedReport = {
      reportId: report.reportId,
      applicantId: report.applicantId,
      name: report.name,
      age: report.age,
      sex: report.sex,
      maritalStatus: report.maritalStatus || "Single", // Default value
      passportNo: report.passportNo,
      passportExpiry: report.passportExpiry?.split('T')[0] || "", // Format date
      passportIssuePlace: report.passportIssuePlace || "NEPAL", // Default value
      examinationDate: report.examinationDate?.split('T')[0] || "", // Format date
      destination: report.destination,
      nationality: report.nationality,
      // Physical examination data
      height: report.physicalExamination?.height || "",
      weight: report.physicalExamination?.weight || "",
      pulse: report.physicalExamination?.pulse || "72", // Default normal value
      temperature: report.physicalExamination?.temperature || "98.6", // Default normal value
      bloodPressure: report.physicalExamination?.bloodPressure || "120/80", // Default normal value
      // Medical findings
      clinicalImpression: report.doctorRemarks || "Normal", // Default value
      labResults: report.testResults || {},
      // Physician information
      physicianName: report.physicianName || "DR. ANUJ SHRESTHA", // Default value
      physicianLicense: report.physicianLicense || "NMC NO.17681", // Default value
      // Contact information
      email: report.email || "",
      phone: report.phone || "",
      address: report.address || "",
      dateOfBirth: report.dateOfBirth?.split('T')[0] || "", // Format date
      medicalHistory: report.medicalHistory || "",
      // Special test results with default values
      chestXRay: report.specialTests?.chestXRay || "Normal",
      ecg: report.specialTests?.ecg || "Normal sinus rhythm",
      vision: report.specialTests?.vision || "6/6 both eyes",
      hearing: report.specialTests?.hearing || "Normal",
      urineTest: report.specialTests?.urineTest || "Normal",
      stoolTest: report.specialTests?.stoolTest || "Normal",
      pregnancyTest: report.specialTests?.pregnancyTest || "Not Applicable",
      vaccinationStatus: report.vaccinationStatus || "Up to date",
    };

    // Return the formatted report data
    return NextResponse.json(formattedReport);
  } catch (error) {
    // Log and handle any errors during report retrieval
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

/**
 * PUT endpoint for updating an existing medical report
 * Accepts form data and transforms it to database structure
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> } 
) {
  try {
    // Extract the report ID from route parameters
    const { reportId } = await params;
    
    // Connect to the database
    await connectDB();
    
    // Parse the JSON request body
    const body = await request.json();
    
    // Transform frontend form data to match database schema structure
    // This ensures proper storage organization in the database
    const updateData = {
      // Personal information
      name: body.name,
      age: body.age,
      sex: body.sex,
      maritalStatus: body.maritalStatus,
      // Passport information
      passportNo: body.passportNo,
      passportExpiry: body.passportExpiry,
      passportIssuePlace: body.passportIssuePlace,
      // Examination details
      examinationDate: body.examinationDate,
      destination: body.destination,
      nationality: body.nationality,
      // Physician information
      physicianName: body.physicianName,
      physicianLicense: body.physicianLicense,
      // Contact information
      email: body.email,
      phone: body.phone,
      address: body.address,
      dateOfBirth: body.dateOfBirth,
      medicalHistory: body.medicalHistory,
      // Test results
      testResults: body.labResults,
      doctorRemarks: body.clinicalImpression,
      // Physical examination (nested structure)
      physicalExamination: {
        height: body.height,
        weight: body.weight,
        bloodPressure: body.bloodPressure,
        pulse: body.pulse,
        temperature: body.temperature,
      },
      // Special tests (nested structure)
      specialTests: {
        chestXRay: body.chestXRay,
        ecg: body.ecg,
        vision: body.vision,
        hearing: body.hearing,
        urineTest: body.urineTest,
        stoolTest: body.stoolTest,
        pregnancyTest: body.pregnancyTest,
      },
      vaccinationStatus: body.vaccinationStatus,
      pdfData: body.pdfData, // PDF generation data
      updatedAt: new Date(), // Track when report was last updated
    };
    
    // Find and update the report in the database
    const updatedReport = await MedicalReport.findOneAndUpdate(
      { reportId },
      updateData,
      { new: true } // Return the updated document
    );

    // Handle case where report is not found
    if (!updatedReport) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Return success response with updated report ID
    return NextResponse.json({
      message: "Report updated successfully",
      reportId: updatedReport.reportId,
    });
  } catch (error) {
    // Log and handle any errors during report update
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}