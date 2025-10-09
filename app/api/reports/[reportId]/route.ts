import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MedicalReport from "@/models/MedicalReport";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> } 
) {
  try {
    const { reportId } = await params;
    
    await connectDB();
    const report = await MedicalReport.findOne({ reportId });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Transform the data to match the form structure
    const formattedReport = {
      reportId: report.reportId,
      applicantId: report.applicantId,
      name: report.name,
      age: report.age,
      sex: report.sex,
      maritalStatus: report.maritalStatus || "Single",
      passportNo: report.passportNo,
      passportExpiry: report.passportExpiry?.split('T')[0] || "",
      passportIssuePlace: report.passportIssuePlace || "NEPAL",
      examinationDate: report.examinationDate?.split('T')[0] || "",
      destination: report.destination,
      nationality: report.nationality,
      height: report.physicalExamination?.height || "",
      weight: report.physicalExamination?.weight || "",
      pulse: report.physicalExamination?.pulse || "72",
      temperature: report.physicalExamination?.temperature || "98.6",
      bloodPressure: report.physicalExamination?.bloodPressure || "120/80",
      clinicalImpression: report.doctorRemarks || "Normal",
      labResults: report.testResults || {},
      physicianName: report.physicianName || "DR. ANUJ SHRESTHA",
      physicianLicense: report.physicianLicense || "NMC NO.17681",
      email: report.email || "",
      phone: report.phone || "",
      address: report.address || "",
      dateOfBirth: report.dateOfBirth?.split('T')[0] || "",
      medicalHistory: report.medicalHistory || "",
      chestXRay: report.specialTests?.chestXRay || "Normal",
      ecg: report.specialTests?.ecg || "Normal sinus rhythm",
      vision: report.specialTests?.vision || "6/6 both eyes",
      hearing: report.specialTests?.hearing || "Normal",
      urineTest: report.specialTests?.urineTest || "Normal",
      stoolTest: report.specialTests?.stoolTest || "Normal",
      pregnancyTest: report.specialTests?.pregnancyTest || "Not Applicable",
      vaccinationStatus: report.vaccinationStatus || "Up to date",
    };

    return NextResponse.json(formattedReport);
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> } 
) {
  try {
    const { reportId } = await params;
    
    await connectDB();
    const body = await request.json();
    
    // Transform the form data back to the database structure
    const updateData = {
      name: body.name,
      age: body.age,
      sex: body.sex,
      maritalStatus: body.maritalStatus,
      passportNo: body.passportNo,
      passportExpiry: body.passportExpiry,
      passportIssuePlace: body.passportIssuePlace,
      examinationDate: body.examinationDate,
      destination: body.destination,
      nationality: body.nationality,
      physicianName: body.physicianName,
      physicianLicense: body.physicianLicense,
      email: body.email,
      phone: body.phone,
      address: body.address,
      dateOfBirth: body.dateOfBirth,
      medicalHistory: body.medicalHistory,
      testResults: body.labResults,
      doctorRemarks: body.clinicalImpression,
      physicalExamination: {
        height: body.height,
        weight: body.weight,
        bloodPressure: body.bloodPressure,
        pulse: body.pulse,
        temperature: body.temperature,
      },
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
      pdfData: body.pdfData,
      updatedAt: new Date(),
    };
    
    const updatedReport = await MedicalReport.findOneAndUpdate(
      { reportId },
      updateData,
      { new: true }
    );

    if (!updatedReport) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Report updated successfully",
      reportId: updatedReport.reportId,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}