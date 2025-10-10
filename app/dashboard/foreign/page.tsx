"use client";
import React, { useState, useEffect } from "react";
import {
  ClipboardCheck,
  FileText,
  User,
  Globe,
  Download,
  Upload,
  Calendar,
  Bell,
  UserPlus,
  LogOut,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

interface ApplicantData {
  applicantId: string;
  firstName: string;
  lastName: string;
  email: string;
  destinationCountry: string;
  status: string;
  medicalReport: string;
  passportScan: string;
  biometricData: string;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
}

const statusConfig = {
  pending: {
    label: "Application Submitted",
    progress: 25,
  },
  under_review: {
    label: "Under Review",
    progress: 50,
  },
  verified: {
    label: "Documents Verified",
    progress: 75,
  },
  approved: {
    label: "Approved - Ready for Deployment",
    progress: 100,
  },
  rejected: {
    label: "Application Rejected",
    progress: 0,
  },
};

const EmployeeDashboard = () => {
  const { data: session } = useSession();
  const [applicantData, setApplicantData] = useState<ApplicantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchApplicantData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/employee/application");
        if (response.status === 404) {
          setApplicantData(null);
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch application data");
        }
        const data = await response.json();
        setApplicantData(data.applicant);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchApplicantData();
    }
  }, [session]);

  const handleDownload = async (type: "medical" | "passport" | "biometric") => {
    if (!applicantData) return;
    
    try {
      const response = await fetch(
        `/api/employee/download?type=${type}&id=${applicantData.applicantId}`
      );
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_report_${applicantData.applicantId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to download document");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const currentStatus = applicantData 
    ? statusConfig[applicantData.status as keyof typeof statusConfig] 
    : null;

  const timelineSteps = applicantData ? [
    {
      label: "Application Submitted",
      date: new Date(applicantData.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      completed: true,
    },
    {
      label: "Documents Verified",
      date: applicantData.status !== "pending" ? new Date(applicantData.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }) : "Pending",
      completed: applicantData.status === "verified" || applicantData.status === "approved",
    },
    {
      label: "Medical Tests Completed",
      date: applicantData.medicalReport ? "Completed" : "Pending",
      completed: !!applicantData.medicalReport,
    },
    {
      label: "Work Permit Processing",
      date: applicantData.status === "verified" ? "In Progress" : applicantData.status === "approved" ? "Completed" : "Pending",
      completed: applicantData.status === "approved",
      inProgress: applicantData.status === "verified",
    },
    {
      label: "Final Approval",
      date: applicantData.status === "approved" ? "Approved" : "Pending",
      completed: applicantData.status === "approved",
    },
  ] : [];

  return (
    <div className="p-6 mx-auto min-h-screen bg-gray-100 text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {applicantData ? "My Application Status" : "Employee Dashboard"}
        </h1>
        <button
          onClick={() => signOut()}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </button>
      </div>

      {applicantData ? (
        <>
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">Application Status</h3>
                <ClipboardCheck className="text-blue-500" size={24} />
              </div>
              <p className="text-lg">{currentStatus?.label}</p>
              <div className="mt-2 bg-blue-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${currentStatus?.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {currentStatus?.progress}% Complete
              </p>
              {applicantData.status === "rejected" && applicantData.rejectionReason && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-xs font-semibold text-red-800">Rejection Reason:</p>
                  <p className="text-xs text-red-700">{applicantData.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">Medical Report</h3>
                <FileText className="text-green-500" size={24} />
              </div>
              <p className="text-lg">
                {applicantData.medicalReport ? "Available" : "Not Uploaded"}
              </p>
              {applicantData.medicalReport && (
                <button
                  onClick={() => handleDownload("medical")}
                  className="mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm flex items-center hover:bg-green-600"
                >
                  <Download size={16} className="mr-1" />
                  Download
                </button>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">Work Permit</h3>
                <User className="text-orange-500" size={24} />
              </div>
              <p className="text-lg">
                {applicantData.status === "approved" 
                  ? "Approved" 
                  : applicantData.status === "verified" 
                  ? "Processing" 
                  : "Pending"}
              </p>
              <p className="text-sm text-gray-600">
                {applicantData.status === "approved" 
                  ? "Ready for deployment" 
                  : "Expected: 2-3 weeks"}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">Destination</h3>
                <Globe className="text-purple-500" size={24} />
              </div>
              <p className="text-lg">{applicantData.destinationCountry}</p>
              <p className="text-sm text-gray-600">
                Applicant: {applicantData.firstName} {applicantData.lastName}
              </p>
            </div>
          </div>

          {/* Application Timeline */}
          <div className="bg-white rounded-lg border mb-6">
            <div className="p-4 border-b">
              <h3 className="font-bold">Application Timeline</h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {timelineSteps.map((step, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className={`w-4 h-4 rounded-full mr-4 ${
                        step.completed
                          ? "bg-green-500"
                          : step.inProgress
                          ? "bg-yellow-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <div>
                      <p
                        className={`font-medium ${
                          step.completed || step.inProgress
                            ? "text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-sm text-gray-600">{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border p-8 mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            No Active Application
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have any active applications yet. Start a new application to begin
            the immigration process.
          </p>
          <Link
            href="/registration"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <UserPlus size={18} className="mr-2" />
            Start New Application
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-bold">Quick Actions</h3>
        </div>
        <div className="p-4 space-y-3">
          {applicantData ? (
            <>
              <button className="w-full bg-blue-500 text-white py-2 px-4 rounded flex items-center justify-center hover:bg-blue-600">
                <Upload size={16} className="mr-2" />
                Upload Additional Documents
              </button>
              <button className="w-full bg-gray-500 text-white py-2 px-4 rounded flex items-center justify-center hover:bg-gray-600">
                <Calendar size={16} className="mr-2" />
                Schedule Appointment
              </button>
              <button className="w-full bg-yellow-500 text-white py-2 px-4 rounded flex items-center justify-center hover:bg-yellow-600">
                <Bell size={16} className="mr-2" />
                Contact Agent
              </button>
              <Link
                href="/registration"
                className="w-full bg-green-600 text-white py-2 px-4 rounded flex items-center justify-center hover:bg-green-700"
              >
                <UserPlus size={16} className="mr-2" />
                New Application
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/registration"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded flex items-center justify-center hover:bg-blue-600"
              >
                <UserPlus size={16} className="mr-2" />
                Start New Application
              </Link>
              <button className="w-full bg-gray-500 text-white py-2 px-4 rounded flex items-center justify-center hover:bg-gray-600">
                <FileText size={16} className="mr-2" />
                View Requirements
              </button>
              <button className="w-full bg-yellow-500 text-white py-2 px-4 rounded flex items-center justify-center hover:bg-yellow-600">
                <Bell size={16} className="mr-2" />
                Contact Support
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;