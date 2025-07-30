import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { Plus, Search, Eye, Calendar, Camera, User, Hash, Filter } from 'lucide-react';

interface Project {
  id: string;
  projectId: string;
  clientName: string;
  eventDate: string;
  shootType: string;
  status: 'Upcoming' | 'In Progress' | 'Completed';
  venue: string;
  createdDate: string;
}

function Projects() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState({
    month: '',
    shootType: '',
    status: '',
    search: ''
  });

  const [projects] = useState<Project[]>([
    {
      id: '1',
      projectId: 'PRJ-2024-001',
      clientName: 'Sarah & John Wedding',
      eventDate: '2024-03-15',
      shootType: 'Wedding',
      status: 'Upcoming',
      venue: 'Goa Beach Resort',
      createdDate: '2024-01-15'
    },
    {
      id: '2',
      projectId: 'PRJ-2024-002',
      clientName: 'Raj & Priya Pre-Wedding',
      eventDate: '2024-02-28',
      shootType: 'Pre-Wedding',
      status: 'In Progress',
      venue: 'Mumbai Beach',
      createdDate: '2024-01-20'
    },
    {
      id: '3',
      projectId: 'PRJ-2024-003',
      clientName: 'Emma Maternity Shoot',
      eventDate: '2024-02-10',
      shootType: 'Maternity',
      status: 'Completed',
      venue: 'Studio Session',
      createdDate: '2024-01-08'
    },
    {
      id: '4',
      projectId: 'PRJ-2024-004',
      clientName: 'Corporate Event - TechCorp',
      eventDate: '2024-03-20',
      shootType: 'Corporate',
      status: 'Upcoming',
      venue: 'Mumbai Convention Center',
      createdDate: '2024-01-25'
    },
    {
      id: '5',
      projectId: 'PRJ-2024-005',
      clientName: 'Arjun Portrait Session',
      eventDate: '2024-02-25',
      shootType: 'Portrait',
      status: 'In Progress',
      venue: 'Outdoor Location',
      createdDate: '2024-02-01'
    }
  ]);

  const shootTypes = ['Wedding', 'Pre-Wedding', 'Maternity', 'Corporate', 'Portrait', 'Events'];
  const statusOptions = ['Upcoming', 'In Progress', 'Completed'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const filteredProjects = projects.filter(project => {
    const eventDate = new Date(project.eventDate);
    const projectMonth = eventDate.toLocaleString('default', { month: 'long' });
    
    const matchesMonth = !filters.month || projectMonth === filters.month;
    const matchesShootType = !filters.shootType || project.shootType === filters.shootType;
    const matchesStatus = !filters.status || project.status === filters.status;
    const matchesSearch = !filters.search || 
      project.clientName.toLowerCase().includes(filters.search.toLowerCase()) ||
      project.projectId.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesMonth && matchesShootType && matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-[#00BCEB] text-white';
      case 'In Progress': return 'bg-[#FF6B00] text-white';
      case 'Completed': return 'bg-green-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Upcoming': return '📅';
      case 'In Progress': return '🔄';
      case 'Completed': return '✅';
      default: return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <Header title="Projects" sidebarCollapsed={sidebarCollapsed} />

        {/* Main Content */}
        <main className="pt-16 p-6">
          {/* Top Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2D2D2D]">Projects</h2>
              <p className="text-gray-600 mt-1">Manage your photography projects and track progress</p>
            </div>
            <button
              onClick={() => window.location.href = '/projects/create'}
              className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </button>
          </div>

          {/* Filters Row */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Month Filter */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Month</label>
                <select
                  value={filters.month}
                  onChange={(e) => handleFilterChange('month', e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                >
                  <option value="">All Months</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              {/* Shoot Type Filter */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Shoot Type</label>
                <select
                  value={filters.shootType}
                  onChange={(e) => handleFilterChange('shootType', e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                >
                  <option value="">All Types</option>
                  {shootTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                >
                  <option value="">All Status</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search by client name or project ID"
                    className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shoot Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.map((project) => (
                    <tr 
                      key={project.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                      onClick={() => window.location.href = `/projects/${project.id}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Hash className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-[#2D2D2D]">{project.projectId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-[#2D2D2D]">{project.clientName}</div>
                            <div className="text-sm text-gray-500">{project.venue}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-[#2D2D2D]">
                            {new Date(project.eventDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Camera className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-[#2D2D2D]">{project.shootType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                          <span className="mr-1">{getStatusIcon(project.status)}</span>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/projects/${project.id}`;
                          }}
                          className="text-[#00BCEB] hover:text-[#00A5CF] transition-colors duration-200"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No projects found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or create a new project</p>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
                onClick={() => window.location.href = `/projects/${project.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Hash className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-[#2D2D2D]">{project.projectId}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                    <span className="mr-1">{getStatusIcon(project.status)}</span>
                    {project.status}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-[#2D2D2D]">{project.clientName}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {new Date(project.eventDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Camera className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">{project.shootType}</span>
                  </div>
                  
                  <div className="text-sm text-gray-500">{project.venue}</div>
                </div>
              </div>
            ))}

            {/* Mobile Empty State */}
            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No projects found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or create a new project</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Projects;