import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MedicalReport from "@/models/MedicalReport";
import Applicant from "@/models/Applicant";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.json();
    const { applicantId, pdfData, ...reportData } = formData;
    const reportId = `MED${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();

    
    const medicalReport = new MedicalReport({
      reportId,
      applicantId,
      reportType: "Medical Examination",
      
      // Add these fields for QR verification
      name: reportData.name,
      age: reportData.age,
      sex: reportData.sex,
      passportNo: reportData.passportNo,
      passportExpiry: reportData.passportExpiry,
      examinationDate: reportData.examinationDate,
      destination: reportData.destination,
      nationality: reportData.nationality,
      physicianName: reportData.physicianName,
      physicianLicense: reportData.physicianLicense,
      
      testResults: reportData.labResults,
      doctorRemarks: reportData.clinicalImpression,
      physicalExamination: {
        height: reportData.height,
        weight: reportData.weight,
        bloodPressure: reportData.bloodPressure,
        pulse: reportData.pulse,
        temperature: reportData.temperature
      },
      specialTests: {
        chestXRay: reportData.chestXRay,
        ecg: reportData.ecg,
        vision: reportData.vision,
        hearing: reportData.hearing,
        urineTest: reportData.urineTest,
        stoolTest: reportData.stoolTest,
        pregnancyTest: reportData.pregnancyTest
      },
      vaccinationStatus: reportData.vaccinationStatus,
      pdfData: pdfData,
      status: "approved",
      createdAt: new Date(),
    });

    await medicalReport.save();
    const updatedApplicant = await Applicant.findOneAndUpdate(
      { applicantId },
      {
        status: "approved",
        medicalReport: pdfData,
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
  } catch (error) {
    console.error("Error saving medical report:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json(
      { error: "Failed to save medical report", details: errorMessage },
      { status: 500 }
    );
  }
}