"use client";
import React, { useState, useEffect } from "react";
import {
  Users,
  Activity,
  Calendar,
  TrendingUp,
  Search,
  RefreshCw,
  Settings,
  Home,
  FileText,
  Bell,
  User,
  BarChart3,
  DollarSign,
  MapPin,
  Download,
  AlertCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import AdminApplicantPage from "@/app/component/AdminApplicantPage";
import AdminMedicalReportsPage from "@/app/component/AdminMedicalPage";

interface LogData {
  _id: string;
  logId: string;
  action: string;
  userId?: string;
  userRole: string;
  userAgent: string;
  details: Record<string, unknown> | null;
  timestamp: string;
}

interface DashboardStats {
  totalLogs: number;
  uniqueUsers: number;
  topActions: { action: string; count: number }[];
  roleDistribution: { role: string; count: number }[];
  recentLogs: LogData[];
  activityTrend: { date: string; count: number }[];
}

const AdminDashboard = () => {
  const [logs, setLogs] = useState<LogData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchLogs();
    }
  }, [selectedTimeRange, activeTab]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/logs?timeRange=${selectedTimeRange}`);
      const data = await response.json();
      setLogs(data.logs);
      calculateStats(data.logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (logsData: LogData[]) => {
    const uniqueUsers = new Set(logsData.filter(log => log.userId).map(log => log.userId)).size;
    
    const actionCounts = logsData.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const roleCounts = logsData.reduce((acc, log) => {
      acc[log.userRole] = (acc[log.userRole] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const roleDistribution = Object.entries(roleCounts)
      .map(([role, count]) => ({ role, count }));

    const activityTrend = logsData.reduce((acc, log) => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const trendData = Object.entries(activityTrend)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setStats({
      totalLogs: logsData.length,
      uniqueUsers,
      topActions,
      roleDistribution,
      recentLogs: logsData.slice(0, 10),
      activityTrend: trendData
    });
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.userRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.logId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionBadgeColor = (action: string) => {
    const colors = {
      'login': 'bg-green-100 text-green-800',
      'logout': 'bg-red-100 text-red-800',
      'create': 'bg-blue-100 text-blue-800',
      'update': 'bg-yellow-100 text-yellow-800',
      'delete': 'bg-red-100 text-red-800',
      'view': 'bg-gray-100 text-gray-800',
    };
    return colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const exportLogs = () => {
    const csvContent = [
      ['Log ID', 'Action', 'User Role', 'Timestamp', 'Details'],
      ...filteredLogs.map(log => [
        log.logId,
        log.action,
        log.userRole,
        formatTimestamp(log.timestamp),
        JSON.stringify(log.details)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const salesData = [
    { month: '20k', sales: 20, profit: 15 },
    { month: '30k', sales: 30, profit: 25 },
    { month: '40k', sales: 65, profit: 45 },
    { month: '50k', sales: 45, profit: 35 },
    { month: '60k', sales: 85, profit: 65 },
    { month: '70k', sales: 55, profit: 40 },
    { month: '80k', sales: 75, profit: 55 },
    { month: '90k', sales: 90, profit: 70 },
    { month: '100k', sales: 85, profit: 65 }
  ];

  const registrationTrend = [
    { year: '2015', count: 20 },
    { year: '2016', count: 45 },
    { year: '2017', count: 65 },
    { year: '2018', count: 40 },
    { year: '2019', count: 95 }
  ];

  const revenueData = [
    { name: 'Q1', value: 25 },
    { name: 'Q2', value: 45 },
    { name: 'Q3', value: 85 },
    { name: 'Q4', value: 30 }
  ];

  const sidebarItems = [
    { id: 'dashboard', label: 'HOME', icon: Home },
    { id: 'account', label: 'ACCOUNT', icon: Users },
    { id: 'reports', label: 'REPORTS', icon: FileText },
    { id: 'alerts', label: 'ALERTS', icon: Bell },
    { id: 'booking', label: 'BOOKING', icon: Calendar },
    { id: 'setting', label: 'SETTING', icon: Settings },
    { id: 'profile', label: 'PROFILE', icon: User }
  ];

  const renderSidebar = () => (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Activity className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold text-gray-800">Dashboard</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 mb-2 ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="text-xs text-gray-500 mb-2">Powered By</div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <Activity className="text-blue-600" size={12} />
          </div>
          <span className="text-sm font-medium text-gray-700">NEOLA</span>
        </div>
      </div>
    </div>
  );

  const renderMainContent = () => {
    if (activeTab === 'account') {
      return <AdminApplicantPage />;
    }

    if (activeTab === 'reports') {
      return <AdminMedicalReportsPage />;
    }

    if (loading && activeTab === 'dashboard') {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <RefreshCw className="animate-spin" size={24} />
            <span className="text-lg">Loading dashboard...</span>
          </div>
        </div>
      );
    }

    if (activeTab !== 'dashboard') {
      return (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{sidebarItems.find(item => item.id === activeTab)?.label}</h2>
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <p className="text-gray-600">This section is under development...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Select Location</option>
                <option>Japan</option>
                <option>USA</option>
                <option>Europe</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold">NM</span>
              </div>
              <span className="text-sm">Nippon Medical Center</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Logs</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalLogs || 0}</p>
                <div className="flex items-center text-green-600 text-sm mt-2">
                  <TrendingUp size={14} className="mr-1" />
                  <span>All time</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Unique Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.uniqueUsers || 0}</p>
                <div className="flex items-center text-blue-600 text-sm mt-2">
                  <Users size={14} className="mr-1" />
                  <span>Active users</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Users className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">89,000</p>
                <div className="flex items-center text-red-600 text-sm mt-2">
                  <span>4.3% Down from yesterday</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <BarChart3 className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Expense</p>
                <p className="text-2xl font-bold text-gray-900">50,000</p>
                <div className="flex items-center text-green-600 text-sm mt-2">
                  <TrendingUp size={14} className="mr-1" />
                  <span>1.8% Up from yesterday</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <DollarSign className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Sales</h3>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none text-black">
                <option>October</option>
                <option>November</option>
                <option>December</option>
              </select>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stackId="1"
                    stroke="#8b5cf6" 
                    fill="#c4b5fd" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stackId="1"
                    stroke="#f97316" 
                    fill="#fb923c" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-400 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Sales</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Profit</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Total Registered Applicants</h3>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none text-black">
                <option>October</option>
                <option>November</option>
                <option>December</option>
              </select>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={registrationTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* System Logs Table */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 text-black"
                  />
                </div>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="all">All Actions</option>
                  {stats?.topActions.map((action) => (
                    <option key={action.action} value={action.action}>
                      {action.action}
                    </option>
                  ))}
                </select>
                <button
                  onClick={exportLogs}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <Download size={16} className="mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Log ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.slice(0, 50).map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.logId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {log.userRole}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No logs found matching your criteria.</p>
            </div>
          )}

          {filteredLogs.length > 50 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Showing first 50 of {filteredLogs.length} logs. Use filters to narrow down results.
              </p>
            </div>
          )}
        </div>

        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none text-black">
              <option>October</option>
              <option>November</option>
              <option>December</option>
            </select>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Revenue']}
                  labelFormatter={(label) => `Quarter: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm inline-block">
              64,966.77
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {renderSidebar()}
      <div className="flex-1 overflow-hidden">
        {renderMainContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;