"use client";
import React, { useEffect, useState } from "react";
import { FileText, LogOut, X, AlertCircle, CheckCircle, Clock, Filter, TrendingUp, Users, Calendar, PieChart, BarChart3, Edit } from "lucide-react";
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
  rejectionReason?: string;
  createdAt: string;
}

const MedicalDashboard = () => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const openRejectModal = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setShowRejectModal(true);
    setRejectionReason("");
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedApplicant(null);
    setRejectionReason("");
  };

  const rejectApplicant = async () => {
    if (!selectedApplicant) return;
    
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      await fetch(`/api/applicants/${selectedApplicant._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          status: "rejected",
          rejectionReason: rejectionReason.trim()
        }),
      });

      const updatedRes = await fetch("/api/applicants");
      const data = await updatedRes.json();
      setApplicants(data);
      
      closeRejectModal();
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

  const filteredApplicants = applicants
    .filter(a => a.status !== "rejected")
    .filter(a => filterStatus === "all" || a.status === filterStatus)
    .filter(a => 
      searchQuery === "" || 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.applicantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.passportNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const pendingCount = applicants.filter((a) => a.status === "pending").length;
  const underReviewCount = applicants.filter((a) => a.status === "under_review").length;
  const approvedCount = applicants.filter((a) => a.status === "approved").length;
  const rejectedCount = applicants.filter((a) => a.status === "rejected").length;

  const statusDistribution = [
    { status: "Pending", count: pendingCount, color: "bg-blue-500", percentage: ((pendingCount / applicants.length) * 100) || 0 },
    { status: "Under Review", count: underReviewCount, color: "bg-yellow-500", percentage: ((underReviewCount / applicants.length) * 100) || 0 },
    { status: "Approved", count: approvedCount, color: "bg-green-500", percentage: ((approvedCount / applicants.length) * 100) || 0 },
    { status: "Rejected", count: rejectedCount, color: "bg-red-500", percentage: ((rejectedCount / applicants.length) * 100) || 0 },
  ];

  const destinationData = applicants.reduce((acc, a) => {
    const country = a.destinationCountry;
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topDestinations = Object.entries(destinationData)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const genderData = applicants.reduce((acc, a) => {
    acc[a.gender] = (acc[a.gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const genderDistribution = Object.entries(genderData)
    .map(([gender, count]) => ({ gender, count }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} className="text-green-600" />;
      case "under_review":
        return <Clock size={16} className="text-yellow-600" />;
      case "pending":
        return <Clock size={16} className="text-blue-600" />;
      default:
        return <AlertCircle size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="p-6 mx-auto min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Medical Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage applicant medical reviews</p>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <LogOut size={18} className="mr-2" />
          Sign Out
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Applicants</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{applicants.length}</p>
              <div className="flex items-center text-blue-600 text-sm mt-2">
                <TrendingUp size={14} className="mr-1" />
                <span>All time</span>
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{pendingCount}</p>
              <div className="flex items-center text-yellow-600 text-sm mt-2">
                <Clock size={14} className="mr-1" />
                <span>Awaiting review</span>
              </div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Approved</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{approvedCount}</p>
              <div className="flex items-center text-green-600 text-sm mt-2">
                <CheckCircle size={14} className="mr-1" />
                <span>Completed</span>
              </div>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Rejected</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{rejectedCount}</p>
              <div className="flex items-center text-red-600 text-sm mt-2">
                <AlertCircle size={14} className="mr-1" />
                <span>Not qualified</span>
              </div>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Alternative Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-blue-600" />
            Status Distribution
          </h3>
          <div className="space-y-4">
            {statusDistribution.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.status}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex space-x-2">
              {statusDistribution.map((item) => (
                <div
                  key={item.status}
                  className={`h-2 rounded-full ${item.color}`}
                  style={{ width: `${item.percentage}%` }}
                  title={`${item.status}: ${item.percentage.toFixed(1)}%`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Top Destinations */}
        <div className="bg-white p-6 rounded-xl shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
            Top Destinations
          </h3>
          <div className="space-y-3">
            {topDestinations.map((destination, index) => (
              <div key={destination.country} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{destination.country}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                  {destination.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-purple-600" />
            Gender Distribution
          </h3>
          <div className="space-y-4">
            {genderDistribution.map((item) => {
              const percentage = ((item.count / applicants.length) * 100) || 0;
              return (
                <div key={item.gender} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">{item.gender}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-orange-600" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {applicants
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 4)
              .map((applicant) => (
                <div key={applicant._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      applicant.status === "approved" ? "bg-green-500" :
                      applicant.status === "pending" ? "bg-blue-500" :
                      applicant.status === "under_review" ? "bg-yellow-500" : "bg-red-500"
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {applicant.firstName} {applicant.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(applicant.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    applicant.status === "approved" ? "bg-green-100 text-green-800" :
                    applicant.status === "pending" ? "bg-blue-100 text-blue-800" :
                    applicant.status === "under_review" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                  }`}>
                    {applicant.status.replace("_", " ")}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-md p-5 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, ID, or passport number..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applicant Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">Applicants List</h3>
          <p className="text-sm text-gray-600 mt-1">
            Showing {filteredApplicants.length} of {applicants.filter(a => a.status !== "rejected").length} applicants
          </p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading applicants...</p>
            </div>
          ) : filteredApplicants.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No applicants found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Applicant ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Passport No</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Destination</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApplicants.map((a) => (
                  <tr key={a._id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{a.applicantId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{a.firstName} {a.lastName}</div>
                      <div className="text-sm text-gray-500">{a.nationality}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.passportNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.destinationCountry}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(a.status)}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Link
                          href={`/reports/generate?applicantId=${a.applicantId}`}
                          className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                            a.status === "approved" || a.status === "rejected"
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md"
                          }`}
                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                            if (a.status === "approved" || a.status === "rejected") {
                              e.preventDefault();
                            } else if (a.status === "pending") {
                              updateApplicantStatus(a._id, "under_review");
                            }
                          }}
                        >
                          <FileText size={16} className="mr-2" />
                          Generate
                        </Link>

                        <button
                          onClick={() => openRejectModal(a)}
                          disabled={a.status === "rejected" || a.status === "approved"}
                          className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                            a.status === "rejected" || a.status === "approved"
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md"
                          }`}
                        >
                          <X size={16} className="mr-2" />
                          Reject
                        </button>

                        {a.medicalReport && (
                          <>
                            <Link
                              href={`/reports/view?reportId=${a.medicalReport}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
                            >
                              <FileText size={16} className="mr-2" />
                              View Report
                            </Link>
                            
                            <Link
                              href={`/reports/generate?applicantId=${a.applicantId}&reportId=${a.medicalReport}&edit=true`}
                              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
                            >
                              <Edit size={16} className="mr-2" />
                              Edit
                            </Link>
                          </>
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

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Reject Applicant</h3>
              <button
                onClick={closeRejectModal}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Applicant: <span className="font-semibold text-gray-900">
                  {selectedApplicant?.firstName} {selectedApplicant?.lastName}
                </span>
              </p>
              <p className="text-gray-600 mb-4">
                ID: <span className="font-semibold text-gray-900">{selectedApplicant?.applicantId}</span>
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection <span className="text-red-600">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejection..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all duration-200"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeRejectModal}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={rejectApplicant}
                disabled={!rejectionReason.trim()}
                className={`flex-1 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium ${
                  rejectionReason.trim()
                    ? "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalDashboard;