import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  Search, 
  Calendar, 
  User, 
  FileText, 
  Camera, 
  DollarSign, 
  Users, 
  Eye, 
  Settings,
  Plus,
  Edit3,
  Trash2,
  Send,
  Upload,
  Download,
  ExternalLink
} from 'lucide-react';

interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  userEmail: string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Sent' | 'Uploaded' | 'Downloaded' | 'Viewed';
  module: 'Leads' | 'Projects' | 'Gallery' | 'Finance' | 'Clients' | 'Team' | 'Settings' | 'Proposals';
  objectId: string;
  objectTitle: string;
  description: string;
}

function ActivityLogs() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Mock activity logs data
  const [activityLogs] = useState<ActivityLog[]>([
    {
      id: '1',
      timestamp: '2024-03-20T10:32:00Z',
      user: 'Arif Khan',
      userEmail: 'arif@photography.com',
      action: 'Created',
      module: 'Proposals',
      objectId: 'PROP-2024-001',
      objectTitle: 'Sarah & John Wedding Proposal',
      description: 'Created new proposal for wedding photography'
    },
    {
      id: '2',
      timestamp: '2024-03-20T11:15:00Z',
      user: 'Priya Sharma',
      userEmail: 'priya@photography.com',
      action: 'Uploaded',
      module: 'Gallery',
      objectId: 'GAL-2024-003',
      objectTitle: 'Emma Maternity Session',
      description: 'Uploaded 45 photos to client gallery'
    },
    {
      id: '3',
      timestamp: '2024-03-20T09:45:00Z',
      user: 'Arif Khan',
      userEmail: 'arif@photography.com',
      action: 'Updated',
      module: 'Leads',
      objectId: 'LEAD-2024-012',
      objectTitle: 'Raj Patel - Pre-Wedding',
      description: 'Updated lead status to Follow-up'
    },
    {
      id: '4',
      timestamp: '2024-03-20T14:22:00Z',
      user: 'Rahul Verma',
      userEmail: 'rahul@photography.com',
      action: 'Sent',
      module: 'Finance',
      objectId: 'INV-2024-008',
      objectTitle: 'Invoice for Corporate Event',
      description: 'Sent invoice via email to TechCorp Solutions'
    },
    {
      id: '5',
      timestamp: '2024-03-20T16:10:00Z',
      user: 'Sneha Patel',
      userEmail: 'sneha@photography.com',
      action: 'Created',
      module: 'Projects',
      objectId: 'PRJ-2024-015',
      objectTitle: 'Anniversary Shoot - Sharma Family',
      description: 'Created new project from accepted proposal'
    },
    {
      id: '6',
      timestamp: '2024-03-19T13:30:00Z',
      user: 'Arif Khan',
      userEmail: 'arif@photography.com',
      action: 'Deleted',
      module: 'Clients',
      objectId: 'CLI-2024-007',
      objectTitle: 'Test Client Entry',
      description: 'Removed duplicate client entry'
    },
    {
      id: '7',
      timestamp: '2024-03-19T15:45:00Z',
      user: 'Priya Sharma',
      userEmail: 'priya@photography.com',
      action: 'Downloaded',
      module: 'Gallery',
      objectId: 'GAL-2024-001',
      objectTitle: 'Wedding Gallery - Sarah & John',
      description: 'Downloaded high-resolution photos for album creation'
    },
    {
      id: '8',
      timestamp: '2024-03-19T11:20:00Z',
      user: 'Arif Khan',
      userEmail: 'arif@photography.com',
      action: 'Updated',
      module: 'Settings',
      objectId: 'SET-BRAND-001',
      objectTitle: 'Studio Branding Settings',
      description: 'Updated studio logo and brand colors'
    }
  ]);

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'Leads': return User;
      case 'Projects': return Camera;
      case 'Gallery': return Eye;
      case 'Finance': return DollarSign;
      case 'Clients': return Users;
      case 'Team': return Users;
      case 'Settings': return Settings;
      case 'Proposals': return FileText;
      default: return FileText;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Created': return Plus;
      case 'Updated': return Edit3;
      case 'Deleted': return Trash2;
      case 'Sent': return Send;
      case 'Uploaded': return Upload;
      case 'Downloaded': return Download;
      case 'Viewed': return Eye;
      default: return FileText;
    }
  };

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'Leads': return 'bg-[#00BCEB] text-white';
      case 'Projects': return 'bg-[#FF6B00] text-white';
      case 'Gallery': return 'bg-purple-500 text-white';
      case 'Finance': return 'bg-green-500 text-white';
      case 'Clients': return 'bg-blue-500 text-white';
      case 'Team': return 'bg-indigo-500 text-white';
      case 'Settings': return 'bg-gray-500 text-white';
      case 'Proposals': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Created': return 'bg-green-100 text-green-800';
      case 'Updated': return 'bg-blue-100 text-blue-800';
      case 'Deleted': return 'bg-red-100 text-red-800';
      case 'Sent': return 'bg-[#FF6B00]/10 text-[#FF6B00]';
      case 'Uploaded': return 'bg-purple-100 text-purple-800';
      case 'Downloaded': return 'bg-indigo-100 text-indigo-800';
      case 'Viewed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
    return { time, date: dateStr };
  };

  const handleObjectClick = (log: ActivityLog) => {
    // Navigate to object detail page based on module
    const routes = {
      'Leads': `/leads/${log.objectId}`,
      'Projects': `/projects/${log.objectId}`,
      'Gallery': `/gallery/${log.objectId}`,
      'Finance': `/finance/${log.objectId}`,
      'Clients': `/clients/${log.objectId}`,
      'Team': `/team/${log.objectId}`,
      'Settings': `/settings`,
      'Proposals': `/proposals/view/${log.objectId}`
    };
    
    const route = routes[log.module as keyof typeof routes];
    if (route) {
      window.location.href = route;
    }
  };

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.objectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase());

    const logDate = new Date(log.timestamp).toISOString().split('T')[0];
    const matchesDateRange = (!dateRange.startDate || logDate >= dateRange.startDate) &&
                            (!dateRange.endDate || logDate <= dateRange.endDate);

    return matchesSearch && matchesDateRange;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <Header title="Activity Logs" sidebarCollapsed={sidebarCollapsed} />

        {/* Main Content */}
        <main className="pt-16 p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2">Activity Logs</h2>
            <p className="text-gray-600">Monitor all user actions and system changes</p>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by user or action"
                    className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  />
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Start Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">End Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Object</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => {
                    const { time, date } = formatTimestamp(log.timestamp);
                    const ModuleIcon = getModuleIcon(log.module);
                    const ActionIcon = getActionIcon(log.action);
                    
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-[#2D2D2D]">{time}</div>
                            <div className="text-gray-500">{date}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-[#00BCEB]/10 rounded-full flex items-center justify-center mr-3">
                              <User className="h-4 w-4 text-[#00BCEB]" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-[#2D2D2D]">{log.user}</div>
                              <div className="text-sm text-gray-500">{log.userEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                            <ActionIcon className="h-3 w-3 mr-1" />
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getModuleColor(log.module)}`}>
                            <ModuleIcon className="h-3 w-3 mr-1" />
                            {log.module}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleObjectClick(log)}
                            className="flex items-center text-[#00BCEB] hover:text-[#00A5CF] transition-colors duration-200"
                          >
                            <span className="text-sm font-medium">{log.objectId}</span>
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </button>
                          <div className="text-sm text-gray-500 truncate max-w-xs" title={log.objectTitle}>
                            {log.objectTitle}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate" title={log.description}>
                            {log.description}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No activity logs found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or date range</p>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredLogs.map((log) => {
              const { time, date } = formatTimestamp(log.timestamp);
              const ModuleIcon = getModuleIcon(log.module);
              const ActionIcon = getActionIcon(log.action);
              
              return (
                <div key={log.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm">
                      <div className="font-medium text-[#2D2D2D]">{time}</div>
                      <div className="text-gray-500">{date}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                        <ActionIcon className="h-3 w-3 mr-1" />
                        {log.action}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getModuleColor(log.module)}`}>
                        <ModuleIcon className="h-3 w-3 mr-1" />
                        {log.module}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-[#00BCEB]/10 rounded-full flex items-center justify-center mr-2">
                        <User className="h-3 w-3 text-[#00BCEB]" />
                      </div>
                      <span className="text-sm font-medium text-[#2D2D2D]">{log.user}</span>
                    </div>
                    
                    <div className="text-sm text-gray-600">{log.description}</div>
                    
                    <button
                      onClick={() => handleObjectClick(log)}
                      className="flex items-center text-[#00BCEB] hover:text-[#00A5CF] transition-colors duration-200 text-sm"
                    >
                      <span className="font-medium">{log.objectId}</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Mobile Empty State */}
            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No activity logs found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or date range</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ActivityLogs;