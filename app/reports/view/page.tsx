"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, Loader2, AlertCircle, Printer, Share2 } from "lucide-react";

// Interface for laboratory test results
interface LabResult {
  result: string;
  reference: string;
  unit?: string;
}

// Interface for complete report data
interface ReportData {
  name: string;
  age: string;
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
  applicantId: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  medicalHistory: string;
  chestXRay: string;
  ecg: string;
  vision: string;
  hearing: string;
  urineTest: string;
  stoolTest: string;
  pregnancyTest: string;
  vaccinationStatus: string;
  reportId: string;
}

/**
 * Main component for viewing medical reports
 * Displays PDF preview with metadata and download options
 */
const ViewReportContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get("reportId"); // Get report ID from URL
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Fetch report data when component mounts or reportId changes
  useEffect(() => {
    if (!reportId) {
      setError("No report ID provided");
      setLoading(false);
      return;
    }

    fetchReport();
  }, [reportId]);

  // Fetch report metadata and PDF from API
  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First fetch report metadata
      const metadataRes = await fetch(`/api/reports/${reportId}`);
      if (!metadataRes.ok) {
        throw new Error("Failed to fetch report metadata");
      }
      const metadata: ReportData = await metadataRes.json();
      setReportData(metadata);
      
      // Then fetch the PDF file
      const pdfRes = await fetch(`/api/reports/view?reportId=${reportId}`);
      if (!pdfRes.ok) {
        throw new Error("Failed to fetch PDF");
      }

      // Create object URL for the PDF blob
      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error("Error fetching report:", err);
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  // Handle PDF download
  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `medical-report-${reportId}.pdf`; // Dynamic filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle print functionality
  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl);
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    }
  };

  // Handle share functionality (modern browsers) or copy link
  const handleShare = async () => {
    if (navigator.share && pdfUrl) {
      try {
        await navigator.share({
          title: `Medical Report - ${reportId}`,
          text: `Medical Report for ${reportData?.name || 'Applicant'}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Report</h2>
          <p className="text-gray-600">Please wait while we fetch the medical report...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-md mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span className="font-medium">Back</span>
          </button>

          {/* Error message */}
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Report</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchReport}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main report view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header section with navigation and actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left side: Back button and report info */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
              >
                <ArrowLeft size={20} className="mr-2" />
                <span className="font-medium">Back</span>
              </button>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <h1 className="text-2xl font-bold text-gray-800">Medical Report</h1>
                </div>
                {reportData && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Report ID:</span> {reportId}
                    {reportData.name && (
                      <span className="ml-4">
                        <span className="font-medium">Patient:</span> {reportData.name}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Printer size={18} className="mr-2" />
                Print
              </button>

              <button
                onClick={handleShare}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Share2 size={18} className="mr-2" />
                Share
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Download size={18} className="mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Report metadata cards */}
        {reportData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
              <p className="text-sm text-gray-600 mb-1">Applicant ID</p>
              <p className="text-lg font-bold text-gray-800">{reportData.applicantId || 'N/A'}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
              <p className="text-sm text-gray-600 mb-1">Examination Date</p>
              <p className="text-lg font-bold text-gray-800">
                {reportData.examinationDate ? new Date(reportData.examinationDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
              <p className="text-sm text-gray-600 mb-1">Destination</p>
              <p className="text-lg font-bold text-gray-800">{reportData.destination || 'N/A'}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className="text-lg font-bold text-green-600">Approved</p>
            </div>
          </div>
        )}

        {/* PDF preview container */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Report Preview</h2>
          </div>
          
          <div className="p-4 bg-gray-100">
            {pdfUrl ? (
              <div className="bg-white rounded-lg shadow-inner overflow-hidden" style={{ height: 'calc(100vh - 400px)', minHeight: '600px' }}>
                {/* PDF iframe viewer */}
                <iframe
                  src={pdfUrl}
                  className="w-full h-full"
                  title="Medical Report PDF"
                  style={{ border: 'none' }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No PDF available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Report information footer */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Report Information</h3>
              <p className="text-sm text-gray-600">
                This is an official medical examination report. Please keep this document secure and provide it to authorized personnel only.
                {reportData?.physicianName && (
                  <span className="block mt-1">
                    Examined by: <span className="font-medium">{reportData.physicianName}</span>
                    {reportData?.physicianLicense && ` (${reportData.physicianLicense})`}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main page component with Suspense wrapper
 * Handles loading state while search params are being accessed
 */
const ViewReportPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Report</h2>
          <p className="text-gray-600">Please wait while we fetch the medical report...</p>
        </div>
      </div>
    }>
      <ViewReportContent />
    </Suspense>
  );
};

export default ViewReportPage;