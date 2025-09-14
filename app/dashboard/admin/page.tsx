"use client";
import React from "react";
import {
  Users,
  Activity,
  DollarSign,
  Globe,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

const mockData = {
  totalApplicants: 1250,
  sales: 45000,
  expenses: 12000,
  topDestinations: ["UAE", "Qatar", "Saudi Arabia", "Kuwait"],
  recentActivities: [
    "New applicant registered - ID: APP001",
    "Medical report generated - ID: MED123",
    "Agent approved - John Smith",
    "System backup completed",
  ],
};

const AdminDashboard = () => {
  return (
    <div className="p-6 mx-auto min-h-screen bg-gray-100 text-black">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
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
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Total Applicants</p>
              <p className="text-2xl font-bold">{mockData.totalApplicants}</p>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Sales (NPR)</p>
              <p className="text-2xl font-bold">
                {mockData.sales.toLocaleString()}
              </p>
            </div>
            <DollarSign className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Expenses (NPR)</p>
              <p className="text-2xl font-bold">
                {mockData.expenses.toLocaleString()}
              </p>
            </div>
            <Activity className="text-red-500" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Net Profit (NPR)</p>
              <p className="text-2xl font-bold">
                {(mockData.sales - mockData.expenses).toLocaleString()}
              </p>
            </div>
            <Globe className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      {/* Top Destinations and Recent Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-bold mb-4">Top Destinations</h3>
          <ul className="space-y-2">
            {mockData.topDestinations.map((dest, index) => (
              <li key={index} className="flex justify-between">
                <span>{dest}</span>
                <span className="text-gray-500">#{index + 1}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-bold mb-4">Recent Activities</h3>
          <ul className="space-y-2">
            {mockData.recentActivities.map((activity, index) => (
              <li key={index} className="text-sm text-gray-600 border-b pb-1">
                {activity}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
