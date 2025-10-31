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
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

interface ApplicantData {
  applicantId: string;
  firstName: string;
  lastName: string;
  email: string;
  destinationCountry: string;
  jobPosition: string;
  status: string;
  paymentStatus: string;
  medicalReport: string;
  passportScan: string;
  biometricData: string;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  region: string;
}

const statusConfig = {
  pending: {
    label: "Application Submitted",
    progress: 25,
    color: "blue",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    borderColor: "border-blue-200",
    progressColor: "bg-blue-500",
  },
  under_review: {
    label: "Under Review",
    progress: 50,
    color: "yellow",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
    borderColor: "border-yellow-200",
    progressColor: "bg-yellow-500",
  },
  verified: {
    label: "Documents Verified",
    progress: 75,
    color: "purple",
    bgColor: "bg-purple-100",
    textColor: "text-purple-800",
    borderColor: "border-purple-200",
    progressColor: "bg-purple-500",
  },
  approved: {
    label: "Approved - Ready for Deployment",
    progress: 100,
    color: "green",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    borderColor: "border-green-200",
    progressColor: "bg-green-500",
  },
  rejected: {
    label: "Application Rejected",
    progress: 0,
    color: "red",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    borderColor: "border-red-200",
    progressColor: "bg-red-500",
  },
};

const ApplicationCard = ({ application }: { application: ApplicantData }) => {
  const [expanded, setExpanded] = useState(false);
  const currentStatus = statusConfig[application.status as keyof typeof statusConfig];

  const handleDownload = async (type: "medical" | "passport" | "biometric") => {
    try {
      const response = await fetch(
        `/api/employee/download?type=${type}&id=${application.applicantId}`
      );
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_report_${application.applicantId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to download document");
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div 
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-bold text-xl text-gray-900">
                {application.firstName} {application.lastName}
              </h3>
              <span className={`px-3 py-1 text-sm rounded-full ${currentStatus.bgColor} ${currentStatus.textColor} border ${currentStatus.borderColor}`}>
                {currentStatus.label}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-gray-400" />
                <span className="font-medium">Destination:</span>
                <span>{application.destinationCountry}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-gray-400" />
                <span className="font-medium">Position:</span>
                <span>{application.jobPosition || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <span className="font-medium">Applied:</span>
                <span>{new Date(application.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-4">
            <div className="text-right">
              <span className="text-sm font-medium text-gray-700 block">Application ID</span>
              <span className="text-sm text-gray-500 font-mono">{application.applicantId}</span>
            </div>
            {expanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Application Progress</span>
            <span className="text-sm text-gray-600">{currentStatus.progress}% Complete</span>
          </div>
          <div className="bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${currentStatus.progressColor}`}
              style={{ width: `${currentStatus.progress}%` }}
            ></div>
          </div>
        </div>

        {application.status === "rejected" && application.rejectionReason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle size={18} className="text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800 mb-1">Rejection Reason:</p>
              <p className="text-sm text-red-700">{application.rejectionReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50/50">
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Medical Report */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Medical Report</h4>
                <FileText className="text-green-500" size={20} />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {application.medicalReport ? "Available for download" : "Not yet uploaded"}
              </p>
              {application.medicalReport && (
                <button
                  onClick={() => handleDownload("medical")}
                  className="w-full bg-green-500 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center hover:bg-green-600 transition-colors"
                >
                  <Download size={16} className="mr-2" />
                  Download Medical Report
                </button>
              )}
            </div>

            {/* Passport Scan */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Passport Scan</h4>
                <FileText className="text-blue-500" size={20} />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {application.passportScan ? "Available for download" : "Not yet uploaded"}
              </p>
              {application.passportScan && (
                <button
                  onClick={() => handleDownload("passport")}
                  className="w-full bg-blue-500 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center hover:bg-blue-600 transition-colors"
                >
                  <Download size={16} className="mr-2" />
                  Download Passport
                </button>
              )}
            </div>

            {/* Payment Status */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Payment Status</h4>
                <ClipboardCheck className="text-purple-500" size={20} />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${
                  application.paymentStatus === "completed" ? "bg-green-500" :
                  application.paymentStatus === "verified" ? "bg-purple-500" : "bg-yellow-500"
                }`}></div>
                <p className="text-sm font-medium text-gray-900">
                  {application.paymentStatus === "completed" 
                    ? "Payment Completed" 
                    : application.paymentStatus === "verified"
                    ? "Payment Verified"
                    : "Payment Pending"}
                </p>
              </div>
              <button className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm flex items-center justify-center hover:bg-gray-200 transition-colors">
                View Payment Details
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-6 border-t border-gray-200 pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg text-sm flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Upload size={16} className="mr-2" />
                Upload Documents
              </button>
              <button className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg text-sm flex items-center justify-center hover:bg-gray-600 transition-colors">
                <Calendar size={16} className="mr-2" />
                Schedule Appointment
              </button>
              <button className="flex-1 bg-yellow-500 text-white py-3 px-4 rounded-lg text-sm flex items-center justify-center hover:bg-yellow-600 transition-colors">
                <Bell size={16} className="mr-2" />
                Contact Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EmployeeDashboard = () => {
  const { data: session } = useSession();
  const [applications, setApplications] = useState<ApplicantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/employee/application");
        if (!response.ok) {
          throw new Error("Failed to fetch applications");
        }
        const data = await response.json();
        setApplications(data.applications || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchApplications();
    }
  }, [session]);

  const filteredApplications = applications.filter(app => {
    if (filter === "all") return true;
    return app.status === filter;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    under_review: applications.filter(a => a.status === "under_review").length,
    verified: applications.filter(a => a.status === "verified").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {session?.user?.name || session?.user?.email}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600 font-medium">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
            <p className="text-sm text-blue-600 font-medium">Pending</p>
            <p className="text-2xl font-bold text-blue-700">{stats.pending}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 shadow-sm">
            <p className="text-sm text-yellow-600 font-medium">Under Review</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.under_review}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 shadow-sm">
            <p className="text-sm text-purple-600 font-medium">Verified</p>
            <p className="text-2xl font-bold text-purple-700">{stats.verified}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 shadow-sm">
            <p className="text-sm text-green-600 font-medium">Approved</p>
            <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 shadow-sm">
            <p className="text-sm text-red-600 font-medium">Rejected</p>
            <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700 mr-3">Filter by status:</span>
            {[
              { value: "all", label: "All Applications" },
              { value: "pending", label: "Pending" },
              { value: "under_review", label: "Under Review" },
              { value: "verified", label: "Verified" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === option.value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Applications List */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {filter === "all" ? "All Applications" : 
               `${filter.charAt(0).toUpperCase() + filter.slice(1).replace('_', ' ')} Applications`}
              <span className="text-gray-500 ml-2 text-lg font-normal">({filteredApplications.length})</span>
            </h2>
            <Link
              href="/registration"
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <UserPlus size={18} className="mr-2" />
              New Application
            </Link>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
              <div className="max-w-md mx-auto">
                <FileText size={64} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {applications.length === 0 ? "No Applications Yet" : "No Matching Applications"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {applications.length === 0 
                    ? "Start your journey by creating your first application. We'll guide you through the process step by step."
                    : `No applications found with status: ${filter.replace('_', ' ')}`}
                </p>
                <Link
                  href="/registration"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus size={18} className="mr-2" />
                  Start New Application
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <ApplicationCard key={application.applicantId} application={application} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              href="/registration"
              className="bg-blue-500 text-white py-3 px-4 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm"
            >
              <UserPlus size={18} className="mr-2" />
              New Application
            </Link>
            <button className="bg-gray-500 text-white py-3 px-4 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors shadow-sm">
              <FileText size={18} className="mr-2" />
              View Requirements
            </button>
            <button className="bg-yellow-500 text-white py-3 px-4 rounded-lg flex items-center justify-center hover:bg-yellow-600 transition-colors shadow-sm">
              <Bell size={18} className="mr-2" />
              Contact Support
            </button>
            <button className="bg-purple-500 text-white py-3 px-4 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors shadow-sm">
              <Download size={18} className="mr-2" />
              Download All Docs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;