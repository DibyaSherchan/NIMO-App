"use client";
import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Search,
  Calendar,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface MedicalReport {
  _id: string;
  reportId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  reportType: string;
  doctorRemarks: string;
  physicalExamination: {
    height: string;
    weight: string;
    bloodPressure: string;
    pulse: string;
    temperature: string;
  };
  specialTests: {
    chestXRay: string;
    ecg: string;
    vision: string;
    hearing: string;
    urineTest: string;
    stoolTest: string;
    pregnancyTest: string;
  };
  vaccinationStatus: string;
  createdAt: string;
}

interface ReportWithPDF extends MedicalReport {
  pdfData: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Stats {
  total: number;
  reportTypeBreakdown: Record<string, number>;
}

const AdminMedicalReportsPage = () => {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReportType, setSelectedReportType] = useState('all');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [stats, setStats] = useState<Stats>({
    total: 0,
    reportTypeBreakdown: {}
  });
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);

  useEffect(() => {
    fetchReports();
  }, [pagination.page, selectedReportType]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        reportType: selectedReportType,
        search: searchTerm
      });

      const response = await fetch(`/api/adminMedical?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReports(data.reports);
        setPagination(data.pagination);
        setStats(data.stats);
      } else {
        console.error('Error fetching reports:', data.error);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchReports();
  };

  const handleDownloadReport = async (reportId: string, applicantName: string) => {
    setDownloading(reportId);
    try {
      const response = await fetch('/api/adminMedical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportId })
      });

      const data = await response.json();

      if (response.ok && data.report.pdfData) {
        const report = data.report as ReportWithPDF;
        const base64Data = report.pdfData.replace(/^data:application\/pdf;base64,/, '');
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Medical_Report_${reportId}_${applicantName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to download report');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report');
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReportTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Pre-Employment': 'bg-blue-100 text-blue-800',
      'Annual Checkup': 'bg-green-100 text-green-800',
      'Work Permit': 'bg-purple-100 text-purple-800',
      'Immigration': 'bg-orange-100 text-orange-800',
      'Visa': 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medical Reports</h1>
          <p className="text-gray-600 mt-1">View and manage all medical reports</p>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Reports</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        {Object.entries(stats.reportTypeBreakdown).slice(0, 3).map(([type, count]) => (
          <div key={type} className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{type}</p>
                <p className="text-3xl font-bold text-gray-900">{count}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by Report ID or Applicant ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <select
            value={selectedReportType}
            onChange={(e) => setSelectedReportType(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Report Types</option>
            <option value="Pre-Employment">Pre-Employment</option>
            <option value="Annual Checkup">Annual Checkup</option>
            <option value="Work Permit">Work Permit</option>
            <option value="Immigration">Immigration</option>
            <option value="Visa">Visa</option>
          </select>

          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Search size={18} />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Report ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Report Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="animate-spin text-blue-600" size={24} />
                      <span className="text-gray-600">Loading reports...</span>
                    </div>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No reports found
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="text-gray-400" size={18} />
                        <span className="font-medium text-gray-900">{report.reportId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{report.applicantName}</div>
                        <div className="text-sm text-gray-500">{report.applicantId}</div>
                        <div className="text-xs text-gray-400">{report.applicantEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getReportTypeBadgeColor(report.reportType)}`}>
                        {report.reportType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        <span>{formatDate(report.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDownloadReport(report.reportId, report.applicantName)}
                          disabled={downloading === report.reportId}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Download Report"
                        >
                          {downloading === report.reportId ? (
                            <RefreshCw className="animate-spin" size={18} />
                          ) : (
                            <Download size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} reports
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Report Details</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Report Information</h3>
                  <div className="space-y-2 text-sm text-black">
                    <div><span className="text-gray-600">Report ID:</span> <span className="font-medium">{selectedReport.reportId}</span></div>
                    <div><span className="text-gray-600">Report Type:</span> <span className="font-medium">{selectedReport.reportType}</span></div>
                    <div><span className="text-gray-600">Created:</span> <span className="font-medium">{formatDate(selectedReport.createdAt)}</span></div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Applicant Information</h3>
                  <div className="space-y-2 text-sm text-black">
                    <div><span className="text-gray-600">Name:</span> <span className="font-medium">{selectedReport.applicantName}</span></div>
                    <div><span className="text-gray-600">ID:</span> <span className="font-medium">{selectedReport.applicantId}</span></div>
                    <div><span className="text-gray-600">Email:</span> <span className="font-medium">{selectedReport.applicantEmail}</span></div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Physical Examination</h3>
                <div className="grid grid-cols-3 gap-4 text-sm text-black">
                  <div><span className="text-gray-600">Height:</span> <span className="font-medium">{selectedReport.physicalExamination.height}</span></div>
                  <div><span className="text-gray-600">Weight:</span> <span className="font-medium">{selectedReport.physicalExamination.weight}</span></div>
                  <div><span className="text-gray-600">BP:</span> <span className="font-medium">{selectedReport.physicalExamination.bloodPressure}</span></div>
                  <div><span className="text-gray-600">Pulse:</span> <span className="font-medium">{selectedReport.physicalExamination.pulse}</span></div>
                  <div><span className="text-gray-600">Temp:</span> <span className="font-medium">{selectedReport.physicalExamination.temperature}</span></div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Special Tests</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-black">
                  <div><span className="text-gray-600">Chest X-Ray:</span> <span className="font-medium">{selectedReport.specialTests.chestXRay}</span></div>
                  <div><span className="text-gray-600">ECG:</span> <span className="font-medium">{selectedReport.specialTests.ecg}</span></div>
                  <div><span className="text-gray-600">Vision:</span> <span className="font-medium">{selectedReport.specialTests.vision}</span></div>
                  <div><span className="text-gray-600">Hearing:</span> <span className="font-medium">{selectedReport.specialTests.hearing}</span></div>
                  <div><span className="text-gray-600">Urine Test:</span> <span className="font-medium">{selectedReport.specialTests.urineTest}</span></div>
                  <div><span className="text-gray-600">Stool Test:</span> <span className="font-medium">{selectedReport.specialTests.stoolTest}</span></div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Doctor&apos;s Remarks</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  {selectedReport.doctorRemarks || 'No remarks provided'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Vaccination Status</h3>
                <p className="text-sm text-gray-600">{selectedReport.vaccinationStatus}</p>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-4">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadReport(selectedReport.reportId, selectedReport.applicantName)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Download size={18} />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMedicalReportsPage;