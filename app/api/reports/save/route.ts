import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MedicalReport from "@/models/MedicalReport";
import Applicant from "@/models/Applicant";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      reportId,
      applicantId,
      name,
      age,
      sex,
      passportNo,
      passportExpiry,
      examinationDate,
      destination,
      nationality,
      height,
      weight,
      pulse,
      temperature,
      bloodPressure,
      clinicalImpression,
      labResults,
      physicianName,
      physicianLicense,
      chestXRay,
      ecg,
      vision,
      hearing,
      urineTest,
      stoolTest,
      pregnancyTest,
      vaccinationStatus,
      pdfData,
    } = body;

    // Validate required fields
    if (!applicantId || !reportId || !name || !passportNo) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the medical report
    const medicalReport = new MedicalReport({
      reportId,
      applicantId,
      reportType: "Medical Examination",
      name,
      age,
      sex,
      passportNo,
      passportExpiry,
      examinationDate,
      destination,
      nationality,
      physicianName,
      physicianLicense,
      status: "approved",
      testResults: labResults,
      doctorRemarks: clinicalImpression,
      physicalExamination: {
        height,
        weight,
        bloodPressure,
        pulse,
        temperature,
      },
      specialTests: {
        chestXRay,
        ecg,
        vision,
        hearing,
        urineTest,
        stoolTest,
        pregnancyTest,
      },
      vaccinationStatus,
      pdfData,
    });

    await medicalReport.save();
    const updatedApplicant = await Applicant.findOneAndUpdate(
      { applicantId },
      {
        status: "approved",
        medicalReport: pdfData, // Store the PDF data in the applicant record
      },
      { new: true }
    );

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
  } catch (error: any) {
    console.error("Error saving medical report:", error);
    return NextResponse.json(
      { error: "Failed to save medical report", details: error.message },
      { status: 500 }
    );
  }
}