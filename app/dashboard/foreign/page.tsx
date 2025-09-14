"use client";
import React from "react";
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
} from "lucide-react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import Link from 'next/link';

const mockData = {
  applicationStatus: "Medical Tests Completed",
  medicalReport: "Available",
  permitStatus: "Processing",
  destination: "UAE",
  agentName: "Nepal Employment Services",
  progress: 75,
};

const EmployeeDashboard = () => {
  return (
    <div className="p-6 mx-auto min-h-screen bg-gray-100 text-black">
      <h1 className="text-2xl font-bold mb-6">My Application Status</h1>
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
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">Application Status</h3>
            <ClipboardCheck className="text-blue-500" size={24} />
          </div>
          <p className="text-lg">{mockData.applicationStatus}</p>
          <div className="mt-2 bg-blue-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${mockData.progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {mockData.progress}% Complete
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">Medical Report</h3>
            <FileText className="text-green-500" size={24} />
          </div>
          <p className="text-lg">{mockData.medicalReport}</p>
          <button className="mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm flex items-center hover:bg-green-600">
            <Download size={16} className="mr-1" />
            Download
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">Work Permit</h3>
            <User className="text-orange-500" size={24} />
          </div>
          <p className="text-lg">{mockData.permitStatus}</p>
          <p className="text-sm text-gray-600">Expected: 2-3 weeks</p>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">Destination</h3>
            <Globe className="text-purple-500" size={24} />
          </div>
          <p className="text-lg">{mockData.destination}</p>
          <p className="text-sm text-gray-600">Agent: {mockData.agentName}</p>
        </div>
      </div>
      {/* Application Timeline */}
      <div className="bg-white rounded-lg border mb-6">
        <div className="p-4 border-b">
          <h3 className="font-bold">Application Timeline</h3>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-4"></div>
              <div>
                <p className="font-medium">Application Submitted</p>
                <p className="text-sm text-gray-600">September 1, 2025</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-4"></div>
              <div>
                <p className="font-medium">Documents Verified</p>
                <p className="text-sm text-gray-600">September 5, 2025</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-4"></div>
              <div>
                <p className="font-medium">Medical Tests Completed</p>
                <p className="text-sm text-gray-600">September 10, 2025</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-4"></div>
              <div>
                <p className="font-medium">Work Permit Processing</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded-full mr-4"></div>
              <div>
                <p className="font-medium text-gray-500">Final Approval</p>
                <p className="text-sm text-gray-400">Pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Quick Actions */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-bold">Quick Actions</h3>
        </div>
        <div className="p-4 space-y-3">
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
        </div>
      </div>
      <Link
        href="/registration"
        className="w-full bg-green-600 text-white py-2 px-4 rounded flex items-center justify-center hover:bg-green-700 mb-3"
      >
        <UserPlus size={16} className="mr-2" />
        New Application
      </Link>
    </div>
  );
};

export default EmployeeDashboard;
