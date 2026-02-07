import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MedicalReport from "@/models/MedicalReport";
import Applicant from "@/models/Applicant";

/**
 * POST endpoint for creating a new medical report
 * Saves the report and updates the applicant's status
 */
export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await connectDB();

    // Parse the incoming form data
    const formData = await req.json();
    const { applicantId, pdfData, ...reportData } = formData;
    
    // Generate a unique report ID with timestamp
    const reportId = `MED${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 5)}`.toUpperCase();

    // Create new medical report document
    const medicalReport = new MedicalReport({
      reportId,
      applicantId,
      reportType: "Medical Examination",
      // Personal information
      name: reportData.name,
      age: reportData.age,
      sex: reportData.sex,
      // Passport information
      passportNo: reportData.passportNo,
      passportExpiry: reportData.passportExpiry,
      // Examination details
      examinationDate: reportData.examinationDate,
      destination: reportData.destination,
      nationality: reportData.nationality,
      // Physician information
      physicianName: reportData.physicianName,
      physicianLicense: reportData.physicianLicense,
      // Test results
      testResults: reportData.labResults,
      doctorRemarks: reportData.clinicalImpression,
      // Physical examination (nested structure)
      physicalExamination: {
        height: reportData.height,
        weight: reportData.weight,
        bloodPressure: reportData.bloodPressure,
        pulse: reportData.pulse,
        temperature: reportData.temperature,
      },
      // Special tests (nested structure)
      specialTests: {
        chestXRay: reportData.chestXRay,
        ecg: reportData.ecg,
        vision: reportData.vision,
        hearing: reportData.hearing,
        urineTest: reportData.urineTest,
        stoolTest: reportData.stoolTest,
        pregnancyTest: reportData.pregnancyTest,
      },
      vaccinationStatus: reportData.vaccinationStatus,
      pdfData: pdfData, // Base64 encoded PDF data
      status: "approved", // Report is automatically approved when created
      createdAt: new Date(),
    });

    // Save the medical report to the database
    await medicalReport.save();
    
    // Update the applicant's status to "approved" and link the medical report
    const updatedApplicant = await Applicant.findOneAndUpdate(
      { applicantId },
      {
        status: "approved",
        medicalReport: reportId, // Link report to applicant
      },
      { new: true } // Return the updated document
    );

    // Handle case where applicant is not found
    if (!updatedApplicant) {
      console.warn(`Applicant with ID ${applicantId} not found`);
      return NextResponse.json(
        {
          success: true,
          reportId,
          message: "Report saved but applicant not found",
        },
        { status: 200 }
      );
    }

    // Return success response with relevant IDs and status
    return NextResponse.json(
      {
        success: true,
        reportId,
        applicantId,
        applicantStatus: updatedApplicant.status,
        message: "Report saved and applicant status updated to approved",
      },
      { status: 200 }
    );
  } catch (error) {
    // Log and handle any errors during report creation
    console.error("Error saving medical report:", error);

    // Extract error message for detailed response
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to save medical report", details: errorMessage },
      { status: 500 }
    );
  }
}