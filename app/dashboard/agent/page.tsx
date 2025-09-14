"use client";
import React from "react";
import { Users, Calendar, DollarSign } from "lucide-react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

// Mock data for agent dashboard
const mockData = {
  applicants: [
    {
      id: "APP001",
      name: "Ram Sharma",
      status: "Medical Pending",
      destination: "UAE",
    },
    {
      id: "APP002",
      name: "Sita Gurung",
      status: "Approved",
      destination: "Qatar",
    },
    {
      id: "APP003",
      name: "Hari Thapa",
      status: "Document Review",
      destination: "Saudi Arabia",
    },
    {
      id: "APP004",
      name: "Maya Patel",
      status: "Medical Pending",
      destination: "Kuwait",
    },
    {
      id: "APP005",
      name: "Bikash Rai",
      status: "Approved",
      destination: "UAE",
    },
  ],
  commission: 2500,
  thisMonth: 8,
};

const AgentDashboard = () => {
  return (
    <div className="p-6 mx-auto min-h-screen bg-gray-100 text-black">
      <h1 className="text-2xl font-bold mb-6">Agent Dashboard</h1>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard Title</h1>
        <button
          onClick={() => signOut()}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Commission (NPR)</p>
              <p className="text-2xl font-bold">
                {mockData.commission.toLocaleString()}
              </p>
            </div>
            <DollarSign className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">This Month</p>
              <p className="text-2xl font-bold">{mockData.thisMonth}</p>
            </div>
            <Calendar className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Total Applicants</p>
              <p className="text-2xl font-bold">{mockData.applicants.length}</p>
            </div>
            <Users className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      {/* Applicants List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-bold">My Applicants</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Destination</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockData.applicants.map((applicant, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2">{applicant.id}</td>
                  <td className="px-4 py-2">{applicant.name}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        applicant.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : applicant.status === "Medical Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {applicant.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{applicant.destination}</td>
                  <td className="px-4 py-2">
                    <button className="text-blue-600 hover:underline text-sm mr-2">
                      View
                    </button>
                    <button className="text-green-600 hover:underline text-sm">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
