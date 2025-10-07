"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, XCircle, AlertCircle, Upload, FileText } from "lucide-react";

export default function VerifyReport() {
  const params = useParams();
  const reportId = params.reportId as string;
  
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [hashMatch, setHashMatch] = useState<boolean | null>(null);

  useEffect(() => {
    fetchReportData();
  }, [reportId]);

  const fetchReportData = async () => {
    try {
      const response = await fetch(`/api/reports/verify/${reportId}`);
      const data = await response.json();
      
      if (response.ok) {
        setReportData(data);
      } else {
        setError(data.error || "Report not found");
      }
    } catch (err) {
      setError("Failed to verify report");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setHashMatch(null);
    }
  };

  const verifyPdfHash = async () => {
    if (!pdfFile) return;
    
    setVerifying(true);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computedHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      
      const response = await fetch(`/api/reports/verify/${reportId}`);
      const data = await response.json();
      
      setHashMatch(computedHash === data.documentHash);
    } catch (err) {
      console.error("Error verifying PDF:", err);
      setHashMatch(false);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Verification Failed
          </h1>
          <p className="text-gray-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  const isValid = reportData?.isValid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-6">
          <div className={`p-6 ${isValid ? "bg-green-50 border-b-4 border-green-500" : "bg-yellow-50 border-b-4 border-yellow-500"}`}>
            <div className="flex items-center justify-center mb-4">
              {isValid ? (
                <CheckCircle2 className="w-20 h-20 text-green-500" />
              ) : (
                <AlertCircle className="w-20 h-20 text-yellow-500" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-center mb-2">
              {isValid ? "Report Verified ✓" : "Report Expired"}
            </h1>
            <p className="text-center text-gray-600">
              {isValid 
                ? "This medical report is authentic and valid" 
                : "This report has expired or is no longer valid"}
            </p>
          </div>

          {/* Report Details */}
          <div className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-500">Report ID</label>
                <p className="text-lg font-mono">{reportData.reportId}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">Patient Name</label>
                <p className="text-lg">{reportData.name}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">Passport No.</label>
                <p className="text-lg">{reportData.passportNo}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">Destination</label>
                <p className="text-lg">{reportData.destination}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">Examination Date</label>
                <p className="text-lg">{new Date(reportData.examinationDate).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">Valid Until</label>
                <p className="text-lg">{new Date(reportData.validUntil).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">Physician</label>
                <p className="text-lg">{reportData.physicianName}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">Status</label>
                <p className={`text-lg font-semibold ${isValid ? "text-green-600" : "text-yellow-600"}`}>
                  {reportData.status.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PDF Verification Card */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-blue-600" />
            Verify PDF Document
          </h2>
          <p className="text-gray-600 mb-6">
            Upload the PDF file to verify its authenticity and ensure it hasn't been tampered with.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700 mb-2">
                {pdfFile ? pdfFile.name : "Click to upload PDF"}
              </p>
              <p className="text-sm text-gray-500">
                Upload the medical report PDF to verify its authenticity
              </p>
            </label>
          </div>

          {pdfFile && (
            <button
              onClick={verifyPdfHash}
              disabled={verifying}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {verifying ? "Verifying..." : "Verify PDF Authenticity"}
            </button>
          )}

          {hashMatch !== null && (
            <div className={`mt-6 p-4 rounded-lg ${hashMatch ? "bg-green-50 border-2 border-green-500" : "bg-red-50 border-2 border-red-500"}`}>
              <div className="flex items-center">
                {hashMatch ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="font-bold text-green-900 text-lg">PDF Verified ✓</p>
                      <p className="text-green-700">
                        The PDF document is authentic and has not been modified.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-8 h-8 text-red-600 mr-3" />
                    <div>
                      <p className="font-bold text-red-900 text-lg">Verification Failed</p>
                      <p className="text-red-700">
                        The PDF document has been modified or is not authentic. Do not trust this document.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <details className="cursor-pointer">
              <summary className="font-semibold text-gray-700 hover:text-blue-600">
                Technical Details
              </summary>
              <div className="mt-4 space-y-2 text-sm text-gray-600 bg-gray-50 p-4 rounded">
                <p><span className="font-semibold">Verification Method:</span> SHA-256 Hash Comparison</p>
                <p><span className="font-semibold">Created:</span> {new Date(reportData.createdAt).toLocaleString()}</p>
                <p><span className="font-semibold">Report ID:</span> {reportData.reportId}</p>
                <p className="text-xs text-gray-500 mt-4">
                  This verification system uses cryptographic hashing to ensure document integrity. 
                  Any modification to the PDF will result in a different hash, making tampering detectable.
                </p>
              </div>
            </details>
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-6 text-center text-sm text-gray-600 bg-white rounded-lg shadow p-4">
          <p className="font-semibold mb-2">About This Verification</p>
          <p>
            This page verifies the authenticity of medical reports issued by Nippon Medical Centre Pvt. Ltd.
            The QR code on the original report links directly to this verification page.
          </p>
        </div>
      </div>
    </div>
  );
}