"use client";
import React, { useEffect, useState } from "react";
import { FileText, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface Applicant {
  _id: string;
  applicantId: string;
  firstName: string;
  lastName: string;
  passportNumber: string;
  passportExpiry: string;
  dateOfBirth: string;
  nationality: string;
  gender: string;
  address: string;
  destinationCountry: string;
  passportScan?: string;
  medicalReport?: string;
  biometricData?: string;
  status: string;
  createdAt: string;
}

interface LabResult {
  result: string;
  reference: string;
  unit?: string;
}

interface ReportFormData {
  name: string;
  age: number;
  sex: string;
  maritalStatus: string;
  passportNo: string;
  passportExpiry: string;
  passportIssuePlace: string;
  examinationDate: string;
  destination: string;
  nationality: string;
  height: string;
  weight: string;
  pulse: string;
  temperature: string;
  bloodPressure: string;
  clinicalImpression: string;
  labResults: Record<string, LabResult>;
  physicianName: string;
  physicianLicense: string;
}

const MedicalDashboard = () => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(
    null
  );
  const [formData, setFormData] = useState<ReportFormData>({
    name: "",
    age: 0,
    sex: "Male",
    maritalStatus: "Single",
    passportNo: "",
    passportExpiry: "",
    passportIssuePlace: "NEPAL",
    examinationDate: new Date().toISOString().split("T")[0],
    destination: "",
    nationality: "",
    height: "",
    weight: "",
    pulse: "",
    temperature: "",
    bloodPressure: "",
    clinicalImpression: "Normal",
    labResults: {
      "Total WBC Count": {
        result: "6,700",
        reference: "4000-11700",
        unit: "/cmm",
      },
      Neutrophils: { result: "66", reference: "43-19%", unit: "%" },
      Lymphocytes: { result: "27", reference: "32-40%", unit: "%" },
      Eosinophils: { result: "03", reference: "17-05%", unit: "%" },
      Monocytes: { result: "04", reference: "01-9%", unit: "%" },
      Basophils: { result: "00", reference: "0-5%", unit: "%" },
      ESR: { result: "10", reference: "M <10.5 <20°", unit: "mm/hr" },
      Hemoglobin: {
        result: "12.6",
        reference: "M 10/Lymph/ 14/Lymph",
        unit: "g/dL",
      },
      "Random Blood Sugar": {
        result: "102",
        reference: "60-140",
        unit: "mg/dL",
      },
      Urea: { result: "25", reference: "20-45", unit: "mg/dL" },
      Creatinine: { result: "1.0", reference: "0.4-1.4", unit: "mg/dL" },
      "Bilirubin (Total/Direct)": {
        result: "0.9/0.3",
        reference: "0.4-1.2 mg/kg (2.7/<0.6)",
      },
      SCPT: { result: "29", reference: "Vps=80 UL", unit: "U/L" },
      SCOT: { result: "27", reference: "Yp>0.0 UL", unit: "U/L" },
      "Anti-HIV (1&2)": { result: "Non Reactive", reference: "" },
      HBsAg: { result: "Negative", reference: "" },
      "Anti-HCV": { result: "Negative", reference: "" },
      "VDIL/RPR": { result: "Non Reactive", reference: "" },
      TPHA: { result: "Non Reactive", reference: "" },
      "ABO-Blood Group & Rh-type": { result: "B+yc", reference: "" },
    },
    physicianName: "DR. ANUJ SHRESTHA",
    physicianLicense: "NMC NO.17681",
  });

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const res = await fetch("/api/applicants");
        const data = await res.json();
        setApplicants(data);
      } catch (err) {
        console.error("Error fetching applicants:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplicants();
  }, []);

  const rejectApplicant = async (applicantId: string) => {
    if (!confirm("Are you sure you want to reject this applicant?")) return;

    try {
      await fetch(`/api/applicants/${applicantId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "rejected" }),
      });

      // Refresh applicants list
      const updatedRes = await fetch("/api/applicants");
      const data = await updatedRes.json();
      setApplicants(data);
      alert("Applicant rejected successfully");
    } catch (error) {
      console.error("Error rejecting applicant:", error);
      alert("Error rejecting applicant");
    }
  };

  const updateApplicantStatus = async (applicantId: string, status: string) => {
    try {
      await fetch(`/api/applicants/${applicantId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error("Error updating applicant status:", error);
    }
  };

  const validateForm = () => {
    const requiredFields = [
      "name",
      "age",
      "passportNo",
      "passportExpiry",
      "examinationDate",
      "destination",
      "nationality",
      "height",
      "weight",
      "bloodPressure",
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof ReportFormData]) {
        alert(`Please fill in the ${field} field`);
        return false;
      }
    }

    return true;
  };

  const generateReport = async () => {
    if (!selectedApplicant) return;

    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          applicantId: selectedApplicant.applicantId,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const fileUrl = URL.createObjectURL(blob);
        const contentDisposition = response.headers.get("content-disposition");
        let reportId = new Date().getTime().toString();

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(
            /filename="medical-report-(.+)\.pdf"/
          );
          if (filenameMatch && filenameMatch[1]) {
            reportId = filenameMatch[1];
          }
        }

        // Refresh applicants list
        const res = await fetch("/api/applicants");
        const data = await res.json();
        setApplicants(data);
      } else {
        const error = await response.json();
        alert("Failed to generate report: " + error.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate report");
    }
  };

  const pendingCount = applicants.filter((a) => a.status === "pending").length;

  return (
    <div className="p-6 mx-auto min-h-screen bg-gray-100 text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Medical Organization Dashboard</h1>
        <button
          onClick={() => signOut()}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-gray-600">Total Applicants</p>
          <p className="text-2xl font-bold">{applicants.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-gray-600">Pending Tests</p>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-gray-600">Approved</p>
          <p className="text-2xl font-bold">
            {applicants.filter((a) => a.status === "approved").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-gray-600">Rejected</p>
          <p className="text-2xl font-bold">
            {applicants.filter((a) => a.status === "rejected").length}
          </p>
        </div>
      </div>

      {/* Applicant Table */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-bold">Applicants</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-4">Loading applicants...</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Applicant ID</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Passport No</th>
                  <th className="px-4 py-2 text-left">Destination</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((a) => (
                  <tr key={a._id} className="border-b">
                    <td className="px-4 py-2">{a.applicantId}</td>
                    <td className="px-4 py-2">
                      {a.firstName} {a.lastName}
                    </td>
                    <td className="px-4 py-2">{a.passportNumber}</td>
                    <td className="px-4 py-2">{a.destinationCountry}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          a.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : a.status === "under_review"
                            ? "bg-yellow-100 text-yellow-800"
                            : a.status === "pending"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {a.status.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col space-y-2">
                        <Link
                          href={`/reports/generate?applicantId=${a.applicantId}`}
                          className={`flex items-center px-3 py-1 rounded-md transition duration-200 ${
                            a.status === "under_review" ||
                            a.status === "approved" ||
                            a.status === "rejected"
                              ? "bg-gray-400 text-white cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                          onClick={(e) => {
                            if (
                              a.status === "under_review" ||
                              a.status === "approved" ||
                              a.status === "rejected"
                            ) {
                              e.preventDefault();
                            } else {
                              updateApplicantStatus(a._id, "under_review");
                            }
                          }}
                        >
                          <FileText size={14} className="mr-1" />
                          Generate Report
                        </Link>

                        {/* Reject Button */}
                        <button
                          onClick={() => rejectApplicant(a._id)}
                          disabled={
                            a.status === "rejected" || a.status === "approved"
                          }
                          className={`flex items-center px-3 py-1 rounded-md transition duration-200 ${
                            a.status === "rejected" || a.status === "approved"
                              ? "bg-gray-400 text-white cursor-not-allowed"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          Reject
                        </button>

                        {a.medicalReport && (
                          <a
                            href={`/api/reports/generate?reportId=${a.medicalReport}`}
                            target="_blank"
                            className="text-purple-600 hover:underline text-sm"
                          >
                            View Report
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalDashboard;