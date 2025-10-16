import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid
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
  Copy,
  X,
  MessageSquare,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const GET_ALL_URL = 'https://av8kc9cjeh.execute-api.eu-north-1.amazonaws.com/GetAllProposalsData';
const UPDATE_STATUS_URL = 'https://e419qsiwvk.execute-api.eu-north-1.amazonaws.com/updateproposalStatus';

const newLeadId = uuidv4();
type BackendHistory = { note: string; at: string };

interface Proposal {
  id: string;
  proposalId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  leadId: string;
  shootType: string;
  eventDate: string;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Expired' | 'pending' | 'RevisionRequested';
  sentDate?: string;
  viewedDate?: string;
  responseDate?: string;
  validUntil: string;
  services: Array<{ name: string; price: number }>;
  addOns: Array<{ name: string; price: number }>;
  notes?: string;

  // NEW: change requests
  latestRevisionNote?: string;
  revisionHistory?: BackendHistory[];
}

function normalizeLeadId(input?: string): string {
  if (!input) return '';
  return input.startsWith('LEAD#') ? input.slice('LEAD#'.length) : input;
}

function Proposals() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: '', shootType: '', month: '' });
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  // Row expansion + message modal state
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [messageOpenFor, setMessageOpenFor] = useState<Proposal | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{type:'success'|'error'; text:string} | null>(null);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await fetch(GET_ALL_URL);
        const data = await response.json();

        const arr = Array.isArray(data) ? data : (data.proposals || []);
        const mapped: Proposal[] = arr.map((item: any, index: number) => {
          const leadId = normalizeLeadId(item.leadId || item.PK || item.pk || '');
          const totalNumber =
            typeof item.total === 'number' ? item.total :
            (typeof item.total === 'string' ? Number(item.total) : 0);

          return {
            id: String(index),
            proposalId: item.proposalId,
            clientName: item.clientName,
            clientEmail: item.clientEmail || '',
            clientPhone: item.clientPhone || '',
            leadId,
            shootType: item.shootType,
            eventDate: item.eventDate,
            totalAmount: isNaN(totalNumber) ? 0 : totalNumber,
            status: (item.status || 'pending') as Proposal['status'],
            validUntil: item.validUntil || item.eventDate,
            sentDate: item.timestamp,
            services: Array.isArray(item.services) ? item.services.map((s: any) => ({
              name: s.title,
              price: Number(s.unitPrice || 0) * Number(s.quantity || 0)
            })) : [],
            addOns: Array.isArray(item.addOns) ? item.addOns.filter((a: any) => a.selected).map((a: any) => ({
              name: a.name, price: Number(a.price || 0)
            })) : [],
            notes: item.notes || '',
            latestRevisionNote: item.latestRevisionNote,
            revisionHistory: Array.isArray(item.revisionHistory) ? item.revisionHistory : undefined,
          };
        });

        setProposals(mapped);
      } catch (err) {
        console.error('Error fetching proposals:', err);
        setToast({ type: 'error', text: 'Failed to fetch proposals.' });
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  const shootTypes = ['Wedding', 'Pre-Wedding', 'Maternity', 'Corporate', 'Portrait', 'Events'];
  const statusOptions = ['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Expired', 'RevisionRequested', 'pending'];
  const months = [
    'January','February','March','April','May','June','July','August','September','October','November','December'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Sent': return 'bg-[#00BCEB] text-white';
      case 'Viewed': return 'bg-[#FF6B00] text-white';
      case 'Accepted': return 'bg-green-500 text-white';
      case 'Rejected': return 'bg-red-500 text-white';
      case 'Expired': return 'bg-gray-500 text-white';
      case 'RevisionRequested': return 'bg-yellow-500 text-white';
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
      case 'RevisionRequested': return MessageSquare;
      default: return FileText;
    }
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const filteredProposals = useMemo(() => {
    return proposals.filter(proposal => {
      const eventDate = new Date(proposal.eventDate);
      const proposalMonth = eventDate.toLocaleString('default', { month: 'long' });

      const matchesSearch = !searchTerm ||
        proposal.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.proposalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proposal.clientEmail || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !filters.status || proposal.status === filters.status;
      const matchesShootType = !filters.shootType || proposal.shootType === filters.shootType;
      const matchesMonth = !filters.month || proposalMonth === filters.month;

      return matchesSearch && matchesStatus && matchesShootType && matchesMonth;
    });
  }, [proposals, searchTerm, filters]);

  const handleViewProposal = (proposalId: string) => window.open(`/proposals/view/${proposalId}`, '_blank');
  const handleViewLead = (proposalId: string) => { window.location.href = `/proposals/create/${proposalId}`; };
  const handleEditProposal = (proposalId: string) => { window.location.href = `/proposals/edit/${proposalId}`; };
  const handleDuplicateProposal = (proposalId: string) => { console.log('Duplicating proposal:', proposalId); };

  const formatCurrency = (amount: number) => `₹${(amount || 0).toLocaleString()}`;

  const isExpiringSoon = (validUntil: string) => {
    const expiryDate = new Date(validUntil);
    const today = new Date();
    const days = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return days <= 7 && days > 0;
  };

  const getProposalStats = () => {
    const total = proposals.length;
    const accepted = proposals.filter(p => p.status === 'Accepted').length;
    const pending = proposals.filter(p => p.status === 'pending').length;
    const rejected = proposals.filter(p => p.status === 'Rejected').length;
    return { total, accepted, pending, rejected };
  };

  const stats = getProposalStats();

  const toggleExpand = (pid: string) => {
    setExpandedRows(prev => ({ ...prev, [pid]: !prev[pid] }));
  };

  // Send message -> append to revisionHistory by calling the same Lambda (RevisionRequested + revisionNotes)
  const handleSendMessage = async () => {
    if (!messageOpenFor || !messageText.trim()) return;
    setSending(true);

    try {
      const payload = {
        leadId: messageOpenFor.leadId,
        proposalId: messageOpenFor.proposalId,
        status: 'RevisionRequested',
        revisionNotes: messageText.trim(),
      };

      const res = await fetch(UPDATE_STATUS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setToast({ type: 'error', text: body?.error || `Failed to send message (${res.status})` });
        return;
      }

      const updated = body.updated || {};
      const newHistory: BackendHistory[] = Array.isArray(updated.revisionHistory) ? updated.revisionHistory : [];

      // update proposals list
      setProposals(prev => prev.map(p => {
        if (p.proposalId !== messageOpenFor.proposalId) return p;
        return {
          ...p,
          status: (updated.status as Proposal['status']) || p.status,
          latestRevisionNote: updated.latestRevisionNote ?? p.latestRevisionNote,
          revisionHistory: newHistory.length ? newHistory : p.revisionHistory,
        };
      }));

      setToast({ type: 'success', text: 'Message sent and history updated.' });
      setMessageText('');
      setMessageOpenFor(null);
    } catch (e) {
      console.error(e);
      setToast({ type: 'error', text: 'Network error while sending message.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <Header title="Proposals" sidebarCollapsed={sidebarCollapsed} />

        {/* Main */}
        <main className="pt-16 p-6 max-w-full overflow-hidden">
          {/* Top */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2D2D2D]">Proposals Management</h2>
              <p className="text-gray-600 mt-1">Track and manage all your photography proposals</p>
            </div>
            

<button
  onClick={() => {
    // ✅ Generate a UUID
    
    // ✅ Navigate with the UUID in the URL
    window.location.href = `/proposals/create/${newLeadId}`;
  }}
  className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
>
  <Plus className="h-4 w-4 mr-2" />
  Create Proposal
</button>

          </div>

          {/* Stats */}
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
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-gray-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-700">{stats.pending}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    placeholder="Search by client, proposal ID or email"
                    className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  />
                </div>
              </div>

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

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Proposal</th> */}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Event Details</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Change Requests</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Valid Until</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProposals.map((proposal) => {
                    const StatusIcon = getStatusIcon(proposal.status);
                    const expiringSoon = isExpiringSoon(proposal.validUntil);
                    const isRequested = proposal.status === 'RevisionRequested';
                    const count = proposal.revisionHistory?.length || (proposal.latestRevisionNote ? 1 : 0);
                    const expanded = !!expandedRows[proposal.proposalId];

                    return (
                      <React.Fragment key={proposal.id}>
                        <tr className="hover:bg-gray-50 transition-colors duration-200">
                          {/* <td className="px-4 py-4 w-48">
                            <div>
                              <div className="text-sm font-medium text-[#2D2D2D] truncate">{proposal.proposalId}</div>
                              <div className="text-sm text-gray-500 truncate">{proposal.shootType}</div>
                            </div>
                          </td> */}
                          <td className="px-4 py-4 w-64">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-[#00BCEB]/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="h-4 w-4 text-[#00BCEB]" />
                              </div>
                              <div className="ml-2 min-w-0 flex-1">
                                <div className="text-sm font-medium text-[#2D2D2D] truncate">{proposal.clientName}</div>
                                <div className="text-sm text-gray-500 truncate">{proposal.clientEmail}</div>
                                <button
                                  onClick={() => handleViewLead(proposal.leadId)}
                                  className="text-xs text-[#00BCEB] hover:text-[#00A5CF] transition-colors duration-200 flex items-center mt-1"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View Proposal
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 w-40">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-sm text-[#2D2D2D] truncate">
                                  {new Date(proposal.eventDate).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-gray-500 truncate">{proposal.shootType}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 w-32">
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                              <span className="text-sm font-semibold text-[#2D2D2D] truncate">
                                {formatCurrency(proposal.totalAmount)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 w-32">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(proposal.status)}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              <span className="truncate">{proposal.status}</span>
                            </span>
                          </td>
                          <td className="px-4 py-4 w-36">
                            {isRequested ? (
                              <button
                                onClick={() => toggleExpand(proposal.proposalId)}
                                className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                                title="View change requests"
                              >
                                {expanded ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                                <span className="truncate">{count ? `${count} request${count > 1 ? 's' : ''}` : 'View'}</span>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 w-32">
                            <div className={`text-sm ${expiringSoon ? 'text-[#FF6B00] font-medium' : 'text-gray-600'}`}>
                              <div className="truncate">{new Date(proposal.validUntil).toLocaleDateString()}</div>
                              {expiringSoon && (
                                <div className="text-xs text-[#FF6B00]">Expiring Soon!</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 w-32">
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleViewProposal(proposal.proposalId)}
                                className="p-1.5 text-[#00BCEB] hover:text-[#00A5CF] hover:bg-[#00BCEB]/10 rounded-lg transition-colors duration-200"
                                title="View Proposal"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {proposal.status === 'Draft' && (
                                <button
                                  onClick={() => handleEditProposal(proposal.id)}
                                  className="p-1.5 text-[#FF6B00] hover:text-[#e55a00] hover:bg-[#FF6B00]/10 rounded-lg transition-colors duration-200"
                                  title="Edit Proposal"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              )}
                              {isRequested && (
                                <button
                                  onClick={() => setMessageOpenFor(proposal)}
                                  className="p-1.5 text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                                  title="Send Message"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDuplicateProposal(proposal.id)}
                                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                title="Duplicate Proposal"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded history row */}
                        {isRequested && expanded && (
                          <tr className="bg-yellow-50/40">
                            <td colSpan={8} className="px-4 py-4">
                              <div className="space-y-3">
                                <div className="text-sm font-semibold text-[#2D2D2D]">Change Request History</div>
                                {(proposal.revisionHistory?.length
                                  ? proposal.revisionHistory
                                  : proposal.latestRevisionNote
                                    ? [{ note: proposal.latestRevisionNote, at: '' }]
                                    : []
                                ).map((h, idx) => (
                                  <div key={idx} className="flex items-start justify-between bg-white border border-yellow-200 rounded-lg p-3">
                                    <div className="text-sm text-gray-800">{h.note}</div>
                                    <div className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                                      {h.at ? new Date(h.at).toLocaleString() : ''}
                                    </div>
                                  </div>
                                ))}

                                {!proposal.revisionHistory?.length && !proposal.latestRevisionNote && (
                                  <div className="text-sm text-gray-500 italic">No notes yet.</div>
                                )}

                                <div>
                                  <button
                                    onClick={() => setMessageOpenFor(proposal)}
                                    className="inline-flex items-center px-3 py-2 bg-yellow-500 text-white rounded-lg text-xs font-semibold hover:bg-yellow-600 transition-colors"
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Send Message
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredProposals.length === 0 && !loading && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No proposals found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or create a new proposal</p>
              </div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredProposals.map((proposal) => {
              const StatusIcon = getStatusIcon(proposal.status);
              const expiringSoon = isExpiringSoon(proposal.validUntil);
              const isRequested = proposal.status === 'RevisionRequested';
              const count = proposal.revisionHistory?.length || (proposal.latestRevisionNote ? 1 : 0);

              return (
                <div key={proposal.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
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
                      <span className="text-gray-600">Event:</span>
                      <span className="text-[#2D2D2D]">{new Date(proposal.eventDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valid Until:</span>
                      <span className={expiringSoon ? 'text-[#FF6B00] font-medium' : 'text-[#2D2D2D]'}>{new Date(proposal.validUntil).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {isRequested && (
                    <>
                      <div className="mt-3 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 inline-flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {count ? `${count} request${count > 1 ? 's' : ''}` : 'Change requested'}
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => setMessageOpenFor(proposal)}
                          className="w-full inline-flex items-center justify-center px-3 py-2 bg-yellow-500 text-white rounded-lg text-xs font-semibold hover:bg-yellow-600 transition-colors"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Send Message
                        </button>
                      </div>
                    </>
                  )}
                  

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
                        onClick={() => handleViewProposal(proposal.proposalId)}
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

            {filteredProposals.length === 0 && !loading && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No proposals found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or create a new proposal</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Message Modal */}
      {messageOpenFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !sending && setMessageOpenFor(null)} />
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#2D2D2D]">
                Send Message — {messageOpenFor.proposalId}
              </h3>
              <button
                onClick={() => !sending && setMessageOpenFor(null)}
                className="p-2 rounded hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              This will be saved to the proposal’s change request history.
            </p>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200 resize-none"
              placeholder="Type your message to the client..."
              disabled={sending}
            />
            <div className="flex items-center justify-end space-x-3 mt-4">
              <button
                onClick={() => setMessageOpenFor(null)}
                className="px-4 py-2 text-[#2D2D2D] bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 disabled:opacity-60"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sending || !messageText.trim()}
                className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  messageText.trim() && !sending
                    ? 'bg-[#FF6B00] text-white hover:bg-[#e55a00]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          <p className="font-medium">{toast.text}</p>
        </div>
      )}
    </div>
  );
}

export default Proposals;