"use client";
import React, { useState, useEffect } from "react";
import {
  Users,
  Activity,
  Globe,
  LogOut,
  Calendar,
  Download,
  TrendingUp,
  AlertCircle,
  Search,
  RefreshCw,
} from "lucide-react";
import { signOut } from "next-auth/react";

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

  useEffect(() => {
    fetchLogs();
  }, [selectedTimeRange]);

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

  if (loading) {
    return (
      <div className="p-6 mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <RefreshCw className="animate-spin" size={24} />
            <span className="text-lg">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor system activity and user logs</p>
        </div>
        <div className="flex items-center space-x-4 text-black">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={() => signOut()}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Logs</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalLogs || 0}</p>
              <p className="text-green-600 text-sm mt-1">
                <TrendingUp size={14} className="inline mr-1" />
                All time
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Activity className="text-blue-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Unique Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.uniqueUsers || 0}</p>
              <p className="text-blue-600 text-sm mt-1">
                <Users size={14} className="inline mr-1" />
                Active users
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="text-green-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Top Action</p>
              <p className="text-xl font-bold text-gray-900">{stats?.topActions[0]?.action || 'N/A'}</p>
              <p className="text-purple-600 text-sm mt-1">
                <AlertCircle size={14} className="inline mr-1" />
                {stats?.topActions[0]?.count || 0} times
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Globe className="text-purple-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Data Range</p>
              <p className="text-xl font-bold text-gray-900">
                {selectedTimeRange.replace('d', ' Days')}
              </p>
              <p className="text-orange-600 text-sm mt-1">
                <Calendar size={14} className="inline mr-1" />
                Current period
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Calendar className="text-orange-600" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Actions</h3>
          <div className="space-y-3">
            {stats?.topActions.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">{item.action}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(item.count / (stats?.topActions[0]?.count || 1)) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-8">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Roles Distribution</h3>
          <div className="space-y-3">
            {stats?.roleDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700 font-medium capitalize">{item.role}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(item.count / Math.max(...(stats?.roleDistribution.map(r => r.count) || [1]))) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-8">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 text-black">
            <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
    </div>
  );
};

export default AdminDashboard;