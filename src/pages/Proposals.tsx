import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Send, 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Filter,
  Download,
  Copy
} from 'lucide-react';

interface Proposal {
  id: string;
  proposalId: string;
  clientName: string;
  clientEmail?: string;
  leadId: string;
  shootType: string;
  eventDate: string;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Expired';
  sentDate?: string;
  viewedDate?: string;
  responseDate?: string;
  validUntil: string;
  services: Array<{
    name: string;
    price: number;
  }>;
  addOns: Array<{
    name: string;
    price: number;
  }>;
  notes?: string;
}

function Proposals() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    shootType: '',
    month: ''
  });

  // Mock proposals data

const [proposals, setProposals] = useState<Proposal[]>([]);
const [loading, setLoading] = useState(true);
useEffect(() => {
  const fetchProposals = async () => {
    try {
      const response = await fetch('https://av8kc9cjeh.execute-api.eu-north-1.amazonaws.com/GetAllProposalsData');
      const data = await response.json();

      // Map backend fields to match your Proposal interface
      const mapped: Proposal[] = data.map((item: any, index: number) => ({
        id: index.toString(),
        proposalId: item.proposalId,
        clientName: item.clientName,
        clientEmail: '', // Not available in response
        leadId: item.leadId,
        shootType: item.shootType,
        eventDate: item.eventDate,
        totalAmount: item.total || 0,
        status: item.status, // Default fallback status
        validUntil: item.validUntil || item.eventDate,
        sentDate: item.timestamp,
        services: item.services.map((s: any) => ({
          name: s.title,
          price: s.unitPrice * s.quantity
        })),
        addOns: item.addOns.filter((a: any) => a.selected).map((a: any) => ({
          name: a.name,
          price: a.price
        })),
        notes: item.notes || ''
      }));

      setProposals(mapped);
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchProposals();
}, []);

  const shootTypes = ['Wedding', 'Pre-Wedding', 'Maternity', 'Corporate', 'Portrait', 'Events'];
  const statusOptions = ['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Expired'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Sent': return 'bg-[#00BCEB] text-white';
      case 'Viewed': return 'bg-[#FF6B00] text-white';
      case 'Accepted': return 'bg-green-500 text-white';
      case 'Rejected': return 'bg-red-500 text-white';
      case 'Expired': return 'bg-gray-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return FileText;
      case 'Sent': return Send;
      case 'Viewed': return Eye;
      case 'Accepted': return CheckCircle;
      case 'Rejected': return XCircle;
      case 'Expired': return AlertCircle;
      default: return FileText;
    }
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const filteredProposals = proposals.filter(proposal => {
    const eventDate = new Date(proposal.eventDate);
    const proposalMonth = eventDate.toLocaleString('default', { month: 'long' });
    
    const matchesSearch = !searchTerm || 
      proposal.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.proposalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || proposal.status === filters.status;
    const matchesShootType = !filters.shootType || proposal.shootType === filters.shootType;
    const matchesMonth = !filters.month || proposalMonth === filters.month;
    
    return matchesSearch && matchesStatus && matchesShootType && matchesMonth;
  });

  const handleViewProposal = (proposalId: string) => {
    window.open(`/proposals/view/${proposalId}`, '_blank');
  };

  const handleViewLead = (leadId: string) => {
    window.location.href = `/leads/${leadId}`;
  };

  const handleEditProposal = (proposalId: string) => {
    window.location.href = `/proposals/edit/${proposalId}`;
  };

  const handleDuplicateProposal = (proposalId: string) => {
    // Simulate duplication
    console.log('Duplicating proposal:', proposalId);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const isExpiringSoon = (validUntil: string) => {
    const expiryDate = new Date(validUntil);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const getProposalStats = () => {
    const total = proposals.length;
    const accepted = proposals.filter(p => p.status === 'Accepted').length;
    const pending = proposals.filter(p => ['Sent', 'Viewed'].includes(p.status)).length;
    const draft = proposals.filter(p => p.status === 'Draft').length;
    
    return { total, accepted, pending, draft };
  };

  const stats = getProposalStats();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <Header title="Proposals" sidebarCollapsed={sidebarCollapsed} />

        {/* Main Content */}
        <main className="pt-16 p-6">
          {/* Top Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2D2D2D]">Proposals Management</h2>
              <p className="text-gray-600 mt-1">Track and manage all your photography proposals</p>
            </div>
            <button
              onClick={() => window.location.href = '/proposals/create'}
              className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Proposal
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#00BCEB]/10 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-[#00BCEB]" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Proposals</p>
                  <p className="text-2xl font-bold text-[#2D2D2D]">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#FF6B00]/10 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-[#FF6B00]" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-[#FF6B00]">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Edit3 className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    placeholder="Search by client or proposal ID"
                    className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  />
                </div>
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

              {/* Month Filter */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Event Month</label>
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
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProposals.map((proposal) => {
                    const StatusIcon = getStatusIcon(proposal.status);
                    const expiringSoon = isExpiringSoon(proposal.validUntil);
                    
                    return (
                      <tr 
                        key={proposal.id} 
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-[#2D2D2D]">{proposal.proposalId}</div>
                            <div className="text-sm text-gray-500">{proposal.shootType}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-[#00BCEB]/10 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-[#00BCEB]" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-[#2D2D2D]">{proposal.clientName}</div>
                              <div className="text-sm text-gray-500">{proposal.clientEmail}</div>
                              <button
                                onClick={() => handleViewLead(proposal.leadId)}
                                className="text-xs text-[#00BCEB] hover:text-[#00A5CF] transition-colors duration-200 flex items-center mt-1"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View Lead
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-[#2D2D2D]">
                                {new Date(proposal.eventDate).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">{proposal.shootType}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-semibold text-[#2D2D2D]">
                              {formatCurrency(proposal.totalAmount)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(proposal.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {proposal.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${expiringSoon ? 'text-[#FF6B00] font-medium' : 'text-gray-600'}`}>
                            {new Date(proposal.validUntil).toLocaleDateString()}
                            {expiringSoon && (
                              <div className="text-xs text-[#FF6B00]">Expiring Soon!</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewProposal(proposal.proposalId)}
                              className="p-2 text-[#00BCEB] hover:text-[#00A5CF] hover:bg-[#00BCEB]/10 rounded-lg transition-colors duration-200"
                              title="View Proposal"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {proposal.status === 'Draft' && (
                              <button
                                onClick={() => handleEditProposal(proposal.id)}
                                className="p-2 text-[#FF6B00] hover:text-[#e55a00] hover:bg-[#FF6B00]/10 rounded-lg transition-colors duration-200"
                                title="Edit Proposal"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDuplicateProposal(proposal.id)}
                              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                              title="Duplicate Proposal"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredProposals.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No proposals found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or create a new proposal</p>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredProposals.map((proposal) => {
              const StatusIcon = getStatusIcon(proposal.status);
              const expiringSoon = isExpiringSoon(proposal.validUntil);
              
              return (
                <div
                  key={proposal.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-[#2D2D2D]">{proposal.proposalId}</h3>
                      <p className="text-xs text-gray-500">{proposal.clientName}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(proposal.status)}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {proposal.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold text-[#2D2D2D]">{formatCurrency(proposal.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Event Date:</span>
                      <span className="text-[#2D2D2D]">{new Date(proposal.eventDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valid Until:</span>
                      <span className={expiringSoon ? 'text-[#FF6B00] font-medium' : 'text-[#2D2D2D]'}>
                        {new Date(proposal.validUntil).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => handleViewLead(proposal.leadId)}
                      className="text-xs text-[#00BCEB] hover:text-[#00A5CF] transition-colors duration-200 flex items-center"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Lead
                    </button>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewProposal(proposal.id)}
                        className="p-2 text-[#00BCEB] hover:bg-[#00BCEB]/10 rounded-lg transition-colors duration-200"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {proposal.status === 'Draft' && (
                        <button
                          onClick={() => handleEditProposal(proposal.id)}
                          className="p-2 text-[#FF6B00] hover:bg-[#FF6B00]/10 rounded-lg transition-colors duration-200"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicateProposal(proposal.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Mobile Empty State */}
            {filteredProposals.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No proposals found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or create a new proposal</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Proposals;