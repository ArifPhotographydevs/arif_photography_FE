import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import {
  Phone,
  Mail,
  Calendar,
  Camera,
  DollarSign,
  FileText,
  MessageCircle,
  Users,
  Edit3,
  Save,
  X,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

// Define the structure of a Lead
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
  proposalStatus: 'Not Created' | 'Drafted' | 'Sent' | 'Accepted' | 'Rejected';
  assignedTeam: Array<{ name: string; role: string; }>;
  internalNotes: string;
}

function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // State for the lead data, loading status, and potential errors
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for editing internal notes
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');

  const [showWhatsAppToast, setShowWhatsAppToast] = useState(false);

  useEffect(() => {
    // Function to fetch and process lead data
    const fetchLead = async () => {
      // Reset states for re-fetches if the ID changes
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('https://sk8wa56suc.execute-api.eu-north-1.amazonaws.com/GetAllLeads');
        if (!response.ok) {
          throw new Error('Failed to connect to the server.');
        }
        const data = await response.json();

        if (data.success && Array.isArray(data.leads)) {
          const matchedLead = data.leads.find((l: any) => l.leadId === id);

          if (matchedLead) {
            // Map the API data to our Lead interface
            const primaryEvent = matchedLead.eventDetails?.[0];
            const mappedLead: Lead = {
              id: matchedLead.leadId,
              name: `${matchedLead.personalInfo.brideName} & ${matchedLead.personalInfo.groomName}`,
              email: matchedLead.personalInfo.email,
              phone: matchedLead.personalInfo.phoneNumber,
              shootType: matchedLead.selectedEvents.join(', '),
              budget: 'Medium', // Placeholder as API doesn't provide it
              status: (matchedLead.status === 'new' ? 'New' : 'Follow-up') as Lead['status'],
              eventDate: primaryEvent?.date || 'Not specified',
              notes: primaryEvent?.notes || '',
              createdDate: matchedLead.timestamp,
              proposalStatus: 'Not Created', // Default value
              assignedTeam: [], // Default value
              internalNotes: '' // Default value
            };
            setLead(mappedLead);
            setInternalNotes(mappedLead.internalNotes); // Initialize internal notes
          } else {
            setError(`Lead with ID "${id}" was not found.`);
          }
        } else {
          setError('Invalid data format received from server.');
        }
      } catch (err) {
        console.error('Error fetching leads:', err);
        setError('An error occurred while fetching lead details.');
      } finally {
        // This will run regardless of success or failure
        setLoading(false);
      }
    };

    fetchLead();
  }, [id]); // Re-run effect if the lead ID changes

  // --- Conditional Rendering ---
  // 1. Show a loading screen while data is being fetched
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Clock className="h-8 w-8 animate-spin text-[#00BCEB]" />
        <p className="ml-4 text-xl text-gray-700">Loading Lead Details...</p>
      </div>
    );
  }

  // 2. Show an error message if the fetch failed or lead not found
  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="ml-4 text-xl text-red-700">{error}</p>
        <button
            onClick={() => navigate('/leads')}
            className="ml-6 flex items-center text-[#00BCEB] hover:text-[#00A5CF] transition-colors duration-200"
        >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
        </button>
      </div>
    );
  }
  
  // 3. This case handles when loading is false but the lead is still null
  if (!lead) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <p className="text-xl text-gray-700">No lead data to display.</p>
        </div>
      )
  }

  // --- Handler Functions ---
  const handleSaveNotes = () => {
    setLead(prev => prev ? { ...prev, internalNotes } : null);
    setIsEditingNotes(false);
  };

  const handleCancelEdit = () => {
    setInternalNotes(lead.internalNotes);
    setIsEditingNotes(false);
  };

  const handleWhatsAppClick = () => {
    setShowWhatsAppToast(true);
    setTimeout(() => setShowWhatsAppToast(false), 3000);
  };

  const handlePhoneClick = () => {
    window.location.href = `tel:${lead.phone}`;
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${lead.email}`;
  };

  // --- UI Helper Functions ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Follow-up': return 'bg-yellow-100 text-yellow-800';
      case 'Closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProposalStatusColor = (status: string) => {
    switch (status) {
      case 'Not Created': return 'bg-gray-100 text-gray-800';
      case 'Drafted': return 'bg-blue-100 text-blue-800';
      case 'Sent': return 'bg-yellow-100 text-yellow-800';
      case 'Accepted': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getProposalStatusIcon = (status: string) => {
    switch (status) {
      case 'Accepted': return <CheckCircle className="h-4 w-4" />;
      case 'Sent': return <Clock className="h-4 w-4" />;
      case 'Rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
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

  // --- Main Component Render (only if lead data exists) ---
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header title="Lead Details" sidebarCollapsed={sidebarCollapsed} />

        <main className="pt-16 p-6">
          <div className="mb-6">
            <button
              onClick={() => navigate('/leads')}
              className="flex items-center text-[#00BCEB] hover:text-[#00A5CF] mb-4 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </button>
            <div>
              <h2 className="text-3xl font-bold text-[#2D2D2D] mb-2">Lead Details</h2>
              <p className="text-gray-600 text-lg">Manage this lead and take next steps</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Panel - Client Info */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-[#2D2D2D]">Client Information</h3>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Name, Phone, Email, etc. */}
                  {/* Each section now safely accesses `lead` properties */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#00BCEB]/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-[#00BCEB]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-lg font-medium text-[#2D2D2D]">{lead.name}</p>
                    </div>
                  </div>
                  {/* Phone */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#00BCEB]/10 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-[#00BCEB]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Phone</p>
                      <button onClick={handlePhoneClick} className="text-lg font-medium text-[#00BCEB] hover:text-[#00A5CF] transition-colors duration-200">
                        {lead.phone}
                      </button>
                    </div>
                  </div>
                   {/* Email */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#00BCEB]/10 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-[#00BCEB]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-gray-500">Email</p>
                        <button onClick={handleEmailClick} className="text-lg font-medium text-[#00BCEB] hover:text-[#00A5CF] transition-colors duration-200 break-all text-left">
                           {lead.email}
                        </button>
                    </div>
                  </div>
                  {/* Shoot Type */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-full flex items-center justify-center">
                      <Camera className="h-5 w-5 text-[#FF6B00]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Shoot Type</p>
                      <p className="text-lg font-medium text-[#2D2D2D]">{lead.shootType}</p>
                    </div>
                  </div>
                  {/* Budget */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Budget Range</p>
                      <p className={`text-lg font-medium ${getBudgetColor(lead.budget)}`}>{lead.budget}</p>
                    </div>
                  </div>
                  {/* Event Date */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#00BCEB]/10 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-[#00BCEB]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Event Date</p>
                      <p className="text-lg font-medium text-[#2D2D2D]">
                        {lead.eventDate !== 'Not specified' ? new Date(lead.eventDate).toLocaleDateString('en-US', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        }) : 'Not specified'}
                      </p>
                    </div>
                  </div>
                   {/* Notes */}
                  {lead.notes && (
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-[#FF6B00]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-2">Notes</p>
                        <p className="text-[#2D2D2D] leading-relaxed break-words">{lead.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Actions & Timeline */}
            <div className="lg:col-span-3 space-y-6">
              {/* Proposal Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Proposal Status</h3>
                <div className="flex items-center space-x-3">
                  <div className={`inline-flex items-center px-3 py-2 text-sm font-semibold rounded-full ${getProposalStatusColor(lead.proposalStatus)}`}>
                    {getProposalStatusIcon(lead.proposalStatus)}
                    <span className="ml-2">{lead.proposalStatus}</span>
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#2D2D2D]">Internal Notes</h3>
                  {!isEditingNotes && (
                    <button onClick={() => setIsEditingNotes(true)} className="text-[#00BCEB] hover:text-[#00A5CF] transition-colors duration-200">
                      <Edit3 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {isEditingNotes ? (
                  <div className="space-y-3">
                    <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={4} className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200 resize-none" placeholder="Add internal notes..."/>
                    <div className="flex items-center space-x-2">
                      <button onClick={handleSaveNotes} className="flex items-center px-3 py-1 bg-[#00BCEB] text-white rounded-lg text-sm font-medium hover:bg-[#00A5CF] transition-colors duration-200">
                        <Save className="h-3 w-3 mr-1" /> Save
                      </button>
                      <button onClick={handleCancelEdit} className="flex items-center px-3 py-1 bg-gray-100 text-[#2D2D2D] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200">
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[#2D2D2D] leading-relaxed">{lead.internalNotes || 'No internal notes added yet.'}</p>
                )}
              </div>

              {/* Assigned Team */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Assigned Team</h3>
                <div className="space-y-3">
                    {lead.assignedTeam.length > 0 ? lead.assignedTeam.map((member, index) => (
                        <div key={index} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#00BCEB]/10 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-[#00BCEB]" />
                        </div>
                        <div>
                            <p className="font-medium text-[#2D2D2D]">{member.name}</p>
                            <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                        </div>
                    )) : (
                        <p className="text-gray-500">No team members assigned.</p>
                    )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button onClick={() => navigate(`/proposals/create/${lead.id}`)} className="flex items-center justify-center px-4 py-3 bg-[#00BCEB] text-white rounded-lg font-medium hover:bg-[#00A5CF] transition-colors duration-200 shadow-sm hover:shadow-md">
                    <FileText className="h-4 w-4 mr-2" /> Create Proposal
                  </button>
                  <button onClick={() => navigate(`/projects/create?fromLead=${lead.id}`)} className="flex items-center justify-center px-4 py-3 bg-[#00BCEB] text-white rounded-lg font-medium hover:bg-[#00A5CF] transition-colors duration-200 shadow-sm hover:shadow-md">
                    <Camera className="h-4 w-4 mr-2" /> Convert to Project
                  </button>
                  <button onClick={handleWhatsAppClick} className="flex items-center justify-center px-4 py-3 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200 shadow-sm hover:shadow-md sm:col-span-2" title="Follow up via WhatsApp">
                    <MessageCircle className="h-4 w-4 mr-2" /> Send WhatsApp Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* WhatsApp Toast */}
      {showWhatsAppToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <p className="font-medium">WhatsApp message sent to {lead.phone}</p>
        </div>
      )}
    </div>
  );
}

export default LeadDetail;