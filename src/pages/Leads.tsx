import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { Plus, Search, Filter, Eye, Calendar, X, User, Mail, Phone, Camera, DollarSign, FileText } from 'lucide-react';
import { useEffect } from 'react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  shootType: string;
  budget: string;
  status: 'New' | 'Follow-up' | 'Closed';
  eventDate: string;
  notes: string;
  createdDate: string;
}

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  shootType: string;
  budget: string;
  eventDate: string;
  notes: string;
}

function Leads() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    shootType: '',
    budget: '',
    status: '',
    search: ''
  });
  
useEffect(() => {
  const fetchLeads = async () => {
    try {
      const response = await fetch('https://sk8wa56suc.execute-api.eu-north-1.amazonaws.com/GetAllLeads');
      const data = await response.json();
      if (data.success) {
        const mappedLeads = data.leads.map((lead: any) => ({
          id: lead.leadId,
          name: lead.personalInfo.brideName + ' & ' + lead.personalInfo.groomName,
          email: lead.personalInfo.email,
          phone: lead.personalInfo.phoneNumber,
          shootType: lead.selectedEvents.join(', '),
          status: lead.status === 'new' ? 'New' : lead.status === 'follow-up' ? 'Follow-up' : 'Closed',
          eventDate: lead.eventDetails?.[0]?.date || '',
          notes: lead.eventDetails?.map((e: any) => `${e.eventType}: ${e.notes}`).join(' | ') || '',
          createdDate: lead.timestamp?.split('T')[0] || ''
        }));
        setLeads(mappedLeads);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  fetchLeads();
}, []);
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    email: '',
    phone: '',
    shootType: '',
    budget: '',
    eventDate: '',
    notes: ''
  });

  const [leads, setLeads] = useState<Lead[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@email.com',
      phone: '+91 98765 43210',
      shootType: 'Wedding',
      budget: 'High',
      status: 'New',
      eventDate: '2024-03-15',
      notes: 'Outdoor wedding ceremony',
      createdDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Raj Patel',
      email: 'raj@email.com',
      phone: '+91 87654 32109',
      shootType: 'Pre-Wedding',
      budget: 'Medium',
      status: 'Follow-up',
      eventDate: '2024-02-28',
      notes: 'Beach location preferred',
      createdDate: '2024-01-12'
    },
    {
      id: '3',
      name: 'Emma Wilson',
      email: 'emma@email.com',
      phone: '+91 76543 21098',
      shootType: 'Maternity',
      budget: 'Low',
      status: 'Closed',
      eventDate: '2024-02-10',
      notes: 'Studio session',
      createdDate: '2024-01-08'
    }
  ]);

  const shootTypes = ['Wedding', 'Pre-Wedding', 'Maternity', 'Events', 'Portrait', 'Corporate'];
  const budgetRanges = ['Low', 'Medium', 'High'];
  const statusOptions = ['New', 'Follow-up', 'Closed'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const isFormValid = () => {
    return formData.name && formData.email && formData.phone && formData.shootType && formData.budget;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    const newLead: Lead = {
      id: Date.now().toString(),
      ...formData,
      status: 'New',
      createdDate: new Date().toISOString().split('T')[0]
    };

    setLeads(prev => [newLead, ...prev]);
    setFormData({
      name: '',
      email: '',
      phone: '',
      shootType: '',
      budget: '',
      eventDate: '',
      notes: ''
    });
    setShowAddModal(false);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesShootType = !filters.shootType || lead.shootType === filters.shootType;
    const matchesBudget = !filters.budget || lead.budget === filters.budget;
    const matchesStatus = !filters.status || lead.status === filters.status;
    const matchesSearch = !filters.search || 
      lead.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.phone.includes(filters.search);
    
    return matchesShootType && matchesBudget && matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Follow-up': return 'bg-yellow-100 text-yellow-800';
      case 'Closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBudgetColor = (budget: string) => {
    switch (budget) {
      case 'High': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-red-600';
      default: return 'text-gray-600';
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
        <Header title="Leads" sidebarCollapsed={sidebarCollapsed} />

        {/* Main Content */}
        <main className="pt-16 p-6">
          {/* Top Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2D2D2D]">All Leads</h2>
              <p className="text-gray-600 mt-1">Manage and track your photography leads</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </button>
          </div>

          {/* Filters Row */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

              {/* Budget Filter */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Budget Range</label>
                <select
                  value={filters.budget}
                  onChange={(e) => handleFilterChange('budget', e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                >
                  <option value="">All Budgets</option>
                  {budgetRanges.map(budget => (
                    <option key={budget} value={budget}>{budget}</option>
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
                    placeholder="Search by name, phone or email"
                    className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shoot Type</th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                      onClick={() => window.location.href = `/leads/${lead.id}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-[#2D2D2D]">{lead.name}</div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                          <div className="text-sm text-gray-500">{lead.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-[#2D2D2D]">{lead.shootType}</span>
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getBudgetColor(lead.budget)}`}>
                          {lead.budget}
                        </span>
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.createdDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/leads/${lead.id}`;
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
            {filteredLeads.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No leads found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or add a new lead</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-[#2D2D2D]">Add New Lead</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Phone *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                {/* Shoot Type */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Shoot Type *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Camera className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      name="shootType"
                      required
                      value={formData.shootType}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                    >
                      <option value="">Select shoot type</option>
                      {shootTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Budget Range *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      name="budget"
                      required
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                    >
                      <option value="">Select budget range</option>
                      {budgetRanges.map(budget => (
                        <option key={budget} value={budget}>{budget}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Event Date */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Event Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Notes
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                  <textarea
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200 resize-none"
                    placeholder="Add any additional notes..."
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-[#2D2D2D] bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isFormValid()
                      ? 'bg-[#00BCEB] text-white hover:bg-[#00A5CF] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leads;