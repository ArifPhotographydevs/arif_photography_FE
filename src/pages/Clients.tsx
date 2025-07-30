import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  Search, 
  Eye, 
  FileText, 
  X, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Camera, 
  DollarSign,
  Filter
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalProjects: number;
  totalRevenue: number;
  notes: string;
  joinDate: string;
}

function Clients() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState({
    projectCount: '',
    revenueRange: '',
    search: ''
  });
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [noteText, setNoteText] = useState('');

  // Mock clients data
  const [clients, setClients] = useState<Client[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@email.com',
      phone: '+91 98765 43210',
      totalProjects: 3,
      totalRevenue: 275000,
      notes: 'Prefers outdoor shoots. Very punctual client.',
      joinDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Raj Patel',
      email: 'raj@email.com',
      phone: '+91 87654 32109',
      totalProjects: 2,
      totalRevenue: 150000,
      notes: 'Corporate client. Requires quick turnaround.',
      joinDate: '2024-01-20'
    },
    {
      id: '3',
      name: 'Emma Wilson',
      email: 'emma@email.com',
      phone: '+91 76543 21098',
      totalProjects: 1,
      totalRevenue: 45000,
      notes: 'First-time client. Very satisfied with service.',
      joinDate: '2024-02-01'
    },
    {
      id: '4',
      name: 'TechCorp Solutions',
      email: 'events@techcorp.com',
      phone: '+91 65432 10987',
      totalProjects: 5,
      totalRevenue: 425000,
      notes: 'Regular corporate client. Annual contract.',
      joinDate: '2023-12-10'
    },
    {
      id: '5',
      name: 'Arjun Kumar',
      email: 'arjun@email.com',
      phone: '+91 54321 09876',
      totalProjects: 1,
      totalRevenue: 35000,
      notes: 'Portrait session client. Interested in family shoots.',
      joinDate: '2024-02-15'
    },
    {
      id: '6',
      name: 'Priya & Amit Sharma',
      email: 'priya.amit@email.com',
      phone: '+91 43210 98765',
      totalProjects: 4,
      totalRevenue: 320000,
      notes: 'Wedding and anniversary shoots. Loyal clients.',
      joinDate: '2023-11-20'
    }
  ]);

  const projectCountOptions = ['1-2 Projects', '3-5 Projects', '5+ Projects'];
  const revenueRangeOptions = ['₹0-50K', '₹50K-150K', '₹150K-300K', '₹300K+'];

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = !filters.search || 
      client.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      client.phone.includes(filters.search) ||
      client.email.toLowerCase().includes(filters.search.toLowerCase());

    const matchesProjectCount = !filters.projectCount || 
      (filters.projectCount === '1-2 Projects' && client.totalProjects <= 2) ||
      (filters.projectCount === '3-5 Projects' && client.totalProjects >= 3 && client.totalProjects <= 5) ||
      (filters.projectCount === '5+ Projects' && client.totalProjects > 5);

    const matchesRevenue = !filters.revenueRange ||
      (filters.revenueRange === '₹0-50K' && client.totalRevenue <= 50000) ||
      (filters.revenueRange === '₹50K-150K' && client.totalRevenue > 50000 && client.totalRevenue <= 150000) ||
      (filters.revenueRange === '₹150K-300K' && client.totalRevenue > 150000 && client.totalRevenue <= 300000) ||
      (filters.revenueRange === '₹300K+' && client.totalRevenue > 300000);

    return matchesSearch && matchesProjectCount && matchesRevenue;
  });

  const openNoteModal = (client: Client) => {
    setSelectedClient(client);
    setNoteText(client.notes);
    setShowNoteModal(true);
  };

  const handleSaveNote = () => {
    if (selectedClient) {
      setClients(prev => 
        prev.map(client => 
          client.id === selectedClient.id 
            ? { ...client, notes: noteText }
            : client
        )
      );
      setShowNoteModal(false);
      setSelectedClient(null);
      setNoteText('');
    }
  };

  const handleViewProfile = (clientId: string) => {
    // Navigate to client profile - for demo, we'll show an alert
    window.location.href = `/clients/${clientId}`;
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
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
        <Header title="Client Directory" sidebarCollapsed={sidebarCollapsed} />

        {/* Main Content */}
        <main className="pt-16 p-6">
          {/* Top Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2D2D2D]">Client Directory</h2>
              <p className="text-gray-600 mt-1">Manage your client relationships and project history</p>
            </div>
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
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search by name, phone, or email"
                    className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  />
                </div>
              </div>

              {/* Project Count Filter */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Project Count</label>
                <select
                  value={filters.projectCount}
                  onChange={(e) => handleFilterChange('projectCount', e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                >
                  <option value="">All Projects</option>
                  {projectCountOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Revenue Range Filter */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Revenue Range</label>
                <select
                  value={filters.revenueRange}
                  onChange={(e) => handleFilterChange('revenueRange', e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                >
                  <option value="">All Revenue</option>
                  {revenueRangeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Projects</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client) => (
                    <tr 
                      key={client.id} 
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-[#00BCEB]/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-[#00BCEB]" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-[#2D2D2D]">{client.name}</div>
                            <div className="text-sm text-gray-500">
                              Joined {new Date(client.joinDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Camera className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-[#2D2D2D]">{client.totalProjects}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-green-600">{formatCurrency(client.totalRevenue)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-[#2D2D2D]">{client.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-[#2D2D2D]">{client.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewProfile(client.id)}
                            className="p-2 text-[#00BCEB] hover:text-[#00A5CF] hover:bg-[#00BCEB]/10 rounded-lg transition-colors duration-200"
                            title="View Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openNoteModal(client)}
                            className="p-2 text-[#FF6B00] hover:text-[#e55a00] hover:bg-[#FF6B00]/10 rounded-lg transition-colors duration-200"
                            title="Add Note"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No clients found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#00BCEB]/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-[#00BCEB]" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-[#2D2D2D]">{client.name}</h3>
                      <p className="text-xs text-gray-500">
                        Joined {new Date(client.joinDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewProfile(client.id)}
                      className="p-2 text-[#00BCEB] hover:text-[#00A5CF] hover:bg-[#00BCEB]/10 rounded-lg transition-colors duration-200"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openNoteModal(client)}
                      className="p-2 text-[#FF6B00] hover:text-[#e55a00] hover:bg-[#FF6B00]/10 rounded-lg transition-colors duration-200"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center">
                    <Camera className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Projects:</span>
                    <span className="ml-1 font-medium text-[#2D2D2D]">{client.totalProjects}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Revenue:</span>
                    <span className="ml-1 font-medium text-green-600">{formatCurrency(client.totalRevenue)}</span>
                  </div>
                  
                  <div className="flex items-center col-span-2">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600 truncate">{client.email}</span>
                  </div>
                  
                  <div className="flex items-center col-span-2">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">{client.phone}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Mobile Empty State */}
            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No clients found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Note Modal */}
      {showNoteModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-[#2D2D2D]">
                Update Notes for {selectedClient.name}
              </h3>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Client Notes
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200 resize-none"
                  placeholder="Add notes about this client..."
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 text-[#2D2D2D] bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  className="flex items-center px-6 py-2 bg-[#00BCEB] text-white rounded-lg font-medium hover:bg-[#00A5CF] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clients;