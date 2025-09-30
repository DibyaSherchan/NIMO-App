"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Download,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  User,
  RefreshCw,
  MapPin,
  FileText,
} from "lucide-react";

type ApplicantStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "approved"
  | "rejected";

interface Applicant {
  _id: string;
  applicantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  passportNumber: string;
  passportExpiry: string;
  dateOfBirth: string;
  nationality: string;
  gender: string;
  destinationCountry: string;
  medicalHistory: string;
  status: ApplicantStatus;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface StatsInfo {
  total: number;
  statusBreakdown: Record<string, number>;
}

const AdminApplicantPage = () => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingApplicant, setEditingApplicant] = useState<Applicant | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newStatus, setNewStatus] = useState<ApplicantStatus>("pending");
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [stats, setStats] = useState<StatsInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    fetchApplicants();
  }, [debouncedSearchTerm, statusFilter, currentPage]);

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", currentPage.toString());
      params.append("limit", "50");

      console.log("Fetching with params:", params.toString());

      const response = await fetch(`/api/applicants?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      console.log("Received data:", data);
      if (Array.isArray(data)) {
        setApplicants(data);
        setPagination({
          page: currentPage,
          limit: 50,
          total: data.length,
          pages: 1,
        });
        setStats({
          total: data.length,
          statusBreakdown: data.reduce((acc, applicant) => {
            acc[applicant.status] = (acc[applicant.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        });
      } else if (data.applicants) {
        setApplicants(data.applicants);
        setPagination(data.pagination);
        setStats(data.stats);
      } else if (data.data) {
        setApplicants(data.data);
        setPagination(data.pagination);
        setStats(data.stats);
      } else {
        console.warn("Unexpected response structure:", data);
        setApplicants([]);
      }
    } catch (error) {
      console.error("Error fetching applicants:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch applicants"
      );
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, currentPage]);

  const filteredApplicants = React.useMemo(() => {
    let result = applicants;
    if (searchTerm !== debouncedSearchTerm && searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (applicant) =>
          applicant.firstName?.toLowerCase().includes(term) ||
          applicant.lastName?.toLowerCase().includes(term) ||
          applicant.email?.toLowerCase().includes(term) ||
          applicant.applicantId?.toLowerCase().includes(term) ||
          applicant.passportNumber?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [applicants, searchTerm, debouncedSearchTerm]);

  const updateApplicantStatus = async (
    applicantId: string,
    status: ApplicantStatus
  ) => {
    try {
      const response = await fetch(`/api/applicants`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicantId,
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update applicant");
      }
      await fetchApplicants();
      setShowEditModal(false);
      setEditingApplicant(null);
    } catch (error) {
      console.error("Error updating applicant:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update applicant"
      );
    }
  };

  const openEditModal = (applicant: Applicant) => {
    setEditingApplicant(applicant);
    setNewStatus(applicant.status);
    setShowEditModal(true);
  };

  const handleSaveChanges = () => {
    if (editingApplicant) {
      if (newStatus !== editingApplicant.status) {
        updateApplicantStatus(editingApplicant.applicantId, newStatus);
      } else {
        setShowEditModal(false);
      }
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const exportApplicants = () => {
    const csvContent = [
      [
        "ID",
        "Name",
        "Email",
        "Phone",
        "Passport",
        "Nationality",
        "Destination",
        "Status",
        "Created Date",
      ],
      ...filteredApplicants.map((applicant) => [
        applicant.applicantId,
        `${applicant.firstName} ${applicant.lastName}`,
        applicant.email,
        applicant.phone,
        applicant.passportNumber,
        applicant.nationality,
        applicant.destinationCountry,
        applicant.status,
        new Date(applicant.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applicants-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="text-green-600" size={16} />;
      case "rejected":
        return <XCircle className="text-red-600" size={16} />;
      case "under_review":
        return <Clock className="text-yellow-600" size={16} />;
      case "verified":
        return <CheckCircle className="text-blue-600" size={16} />;
      default:
        return <AlertCircle className="text-gray-600" size={16} />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "under_review":
        return "bg-yellow-100 text-yellow-800";
      case "verified":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("_", " ");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && applicants.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <RefreshCw className="animate-spin" size={24} />
            <span className="text-lg">Loading applicants...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && applicants.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Applicants
            </h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchApplicants}
              className="flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw size={16} className="mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Applicant Management
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage all visa applicants
          </p>
        </div>
        <button
          onClick={exportApplicants}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
          disabled={filteredApplicants.length === 0}
        >
          <Download size={16} className="mr-2" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Total Applicants
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.total || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="text-blue-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Pending Review
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.statusBreakdown?.pending || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="text-yellow-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Approved</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.statusBreakdown?.approved || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="text-green-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Rejected</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.statusBreakdown?.rejected || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="text-red-600" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <h3 className="text-lg font-semibold text-gray-900">
            Applicant List ({filteredApplicants.length}{" "}
            {filteredApplicants.length === 1 ? "applicant" : "applicants"})
            {loading && searchTerm !== debouncedSearchTerm && (
              <span className="text-sm text-gray-500 ml-2">(searching...)</span>
            )}
          </h3>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by name, email, passport, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64 text-gray-900"
              />
              {loading && searchTerm !== debouncedSearchTerm && (
                <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" size={16} />
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="verified">Verified</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={fetchApplicants}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              disabled={loading}
            >
              <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Applicants Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Passport
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplicants.map((applicant) => (
                <tr
                  key={applicant._id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="text-blue-600" size={20} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {applicant.firstName} {applicant.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {applicant.applicantId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Mail size={14} className="mr-2 text-gray-400" />
                      {applicant.email}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <Phone size={14} className="mr-2 text-gray-400" />
                      {applicant.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <FileText size={14} className="mr-2 text-gray-400" />
                      {applicant.passportNumber}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {applicant.nationality}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <MapPin size={14} className="mr-2 text-gray-400" />
                      {applicant.destinationCountry}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(applicant.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(
                        applicant.status
                      )}`}
                    >
                      {getStatusIcon(applicant.status)}
                      <span className="ml-1 capitalize">
                        {formatStatus(applicant.status)}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openEditModal(applicant)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Edit size={16} className="mr-1" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredApplicants.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">
              {applicants.length === 0
                ? "No applicants found. Applications will appear here when submitted."
                : "No applicants match your search criteria."}
            </p>
            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={handleClearFilters}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(pagination.pages, prev + 1))
              }
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingApplicant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Applicant Status
              </h3>
              <p className="text-gray-600 mt-1">
                {editingApplicant.firstName} {editingApplicant.lastName}
              </p>
              <p className="text-sm text-gray-500">
                Passport: {editingApplicant.passportNumber}
              </p>
            </div>
            <div className="p-6 space-y-4 text-black">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(e.target.value as ApplicantStatus)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="verified">Verified</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApplicantPage;