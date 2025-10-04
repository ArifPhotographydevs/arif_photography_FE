// ProposalCreate.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Upload,
  FileText,
  Send,
  User,
  Camera,
  Calendar,
  MapPin,
  DollarSign,
  Trash2,
  Check,
  Clock,
  AlertCircle
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

// --- TYPE DEFINITIONS ---
interface Event {
  id: string;
  eventTitle: string;
  date: string;
  time: string;
  description: string;
}

interface ServiceProvided {
  id: string;
  name: string;
  count: number;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
  selected: boolean;
}

interface ProposalData {
  clientName: string;
  recipientEmail: string;
  shootType: string;
  eventDate: string;
  venue: string;
  notes: string;
  events: Event[];
  servicesProvided: ServiceProvided[];
  addOns: AddOn[];
  totalPrice: number;
  logo: File | null;
  termsTemplate: string;
  footerNote: string;
}

// --- DEFAULT / EMPTY PROPOSAL TEMPLATE ---
const emptyProposalTemplate: ProposalData = {
  clientName: '',
  recipientEmail: '',
  shootType: '',
  eventDate: '',
  venue: '',
  notes: '',
  events: [
    { id: '1', eventTitle: 'Wedding Day', date: '', time: '', description: 'Main wedding ceremony and reception coverage' }
  ],
  servicesProvided: [
    { id: '1', name: 'Photography', count: 1 },
    { id: '2', name: 'Videography', count: 1 }
  ],
  addOns: [
    { id: '1', name: 'Drone Photography', price: 15000, selected: false },
    { id: '2', name: 'Teaser Video', price: 25000, selected: false },
    { id: '3', name: 'Highlight Reel', price: 35000, selected: false },
    { id: '4', name: 'Pre-Wedding Shoot', price: 30000, selected: false },
    { id: '5', name: 'Album Design', price: 20000, selected: false }
  ],
  totalPrice: 0,
  logo: null,
  termsTemplate: '',
  footerNote: ''
};

// --- Endpoint constants ---
const GET_LEADS_URL = 'https://sk8wa56suc.execute-api.eu-north-1.amazonaws.com/GetAllLeads';
const GET_PROPOSALS_URL = 'https://av8kc9cjeh.execute-api.eu-north-1.amazonaws.com/GetAllProposalsData';
const POST_PROPOSAL_URL = 'https://cazwal3zzj.execute-api.eu-north-1.amazonaws.com/PostProposalData';
const SENDMAIL_URL = 'https://gqem8o7aw1.execute-api.eu-north-1.amazonaws.com/default/Sendmail';

function ProposalCreate() {
  const { leadId, proposalId } = useParams<{ leadId?: string; proposalId?: string }>();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [proposalData, setProposalData] = useState<ProposalData>({ ...emptyProposalTemplate });

  // --- Fetch initial data (proposalId or leadId) ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const initEmpty = () => {
        setProposalData({ ...emptyProposalTemplate });
        setLogoPreview(null);
      };

      try {
        if (proposalId) {
          const res = await fetch(GET_PROPOSALS_URL);
          if (!res.ok) {
            console.warn('GetAllProposalsData responded non-OK, falling back to empty form.');
            initEmpty();
            setLoading(false);
            return;
          }
          const data = await res.json();
          const arr = Array.isArray(data) ? data : (data.proposals || []);
          const matched = arr.find((p: any) => String(p.proposalId) === String(proposalId));
          if (matched) {
            const mappedEvents: Event[] = Array.isArray(matched.events) && matched.events.length
              ? matched.events.map((e: any, idx: number) => ({
                  id: e.id?.toString?.() || `evt-${idx}`,
                  eventTitle: e.eventTitle || e.title || '',
                  date: e.date || '',
                  time: e.time || '',
                  description: e.description || ''
                }))
              : [ ...emptyProposalTemplate.events ];

            const mappedServicesProvided: ServiceProvided[] = Array.isArray(matched.servicesProvided) && matched.servicesProvided.length
              ? matched.servicesProvided.map((s: any, idx: number) => ({
                  id: s.id?.toString?.() || `svc-${idx}`,
                  name: s.name || '',
                  count: Number(s.count || 1)
                }))
              : [ ...emptyProposalTemplate.servicesProvided ];

            const mappedAddOns: AddOn[] = Array.isArray(matched.addOns) && matched.addOns.length
              ? matched.addOns.map((a: any, idx: number) => ({
                  id: a.id?.toString?.() || `addon-${idx}`,
                  name: a.name || a.title || '',
                  price: Number(a.price ?? 0),
                  selected: !!a.selected
                }))
              : [ ...emptyProposalTemplate.addOns ];

            const eventDate = matched.eventDate ? new Date(matched.eventDate).toISOString().split('T')[0] : '';

            setProposalData({
              clientName: matched.clientName || matched.client || '',
              recipientEmail: matched.clientEmail || matched.recipientEmail || '',
              shootType: matched.shootType || '',
              eventDate,
              venue: matched.venue || '',
              notes: matched.notes || matched.description || '',
              events: mappedEvents,
              servicesProvided: mappedServicesProvided,
              addOns: mappedAddOns,
              totalPrice: Number(matched.totalPrice || 0),
              logo: null,
              termsTemplate: matched.termsTemplate || '',
              footerNote: matched.footerNote || matched.footer || ''
            });

            if (matched.logo || matched.logoUrl || (matched.logos && matched.logos[0])) {
              const candidate = matched.logoUrl || matched.logo || (matched.logos && matched.logos[0]);
              if (typeof candidate === 'string') setLogoPreview(candidate);
            }

            setLoading(false);
            return;
          } else {
            console.info(`Proposal with ID "${proposalId}" not found. Falling back to lead fetch or empty form.`);
          }
        }

        if (leadId) {
          try {
            const response = await fetch(GET_LEADS_URL);
            if (!response.ok) {
              console.warn('Lead API responded with non-OK status, falling back to empty proposal form.');
              initEmpty();
              setLoading(false);
              return;
            }
            const leadData = await response.json();
            if (leadData.success && Array.isArray(leadData.leads)) {
              const matchedLead = leadData.leads.find((l: any) => String(l.leadId) === String(leadId));
              if (matchedLead) {
                const primaryEvent = matchedLead.eventDetails?.[0];
                const clientName = matchedLead.personalInfo?.brideName && matchedLead.personalInfo?.groomName
                  ? `${matchedLead.personalInfo.brideName} & ${matchedLead.personalInfo.groomName}`
                  : (matchedLead.personalInfo?.name || '');
                const shootType = Array.isArray(matchedLead.selectedEvents) ? matchedLead.selectedEvents.join(', ') : (matchedLead.selectedEvents || '');
                const eventDate = primaryEvent?.date ? new Date(primaryEvent.date).toISOString().split('T')[0] : '';
                const recipientEmail = matchedLead.personalInfo?.email || '';

                setProposalData(prev => ({
                  ...prev,
                  clientName,
                  shootType,
                  eventDate,
                  recipientEmail
                }));
                setLoading(false);
                return;
              } else {
                console.info(`Lead with ID "${leadId}" not found. Initializing empty proposal form.`);
                initEmpty();
                setLoading(false);
                return;
              }
            } else {
              console.warn('Invalid data format received from GetAllLeads; falling back to empty proposal form.');
              initEmpty();
              setLoading(false);
              return;
            }
          } catch (leadErr: any) {
            console.error('Error fetching lead for proposal:', leadErr);
            initEmpty();
            setLoading(false);
            return;
          }
        }

        // default: empty
        initEmpty();
      } catch (err: any) {
        console.error('Error while fetching initial data for ProposalCreate:', err);
        setError('Failed to load initial data. You can still create a proposal manually.');
        setProposalData({ ...emptyProposalTemplate });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [leadId, proposalId]);

  // --- helpers & handlers ---
  const handleInputChange = (field: keyof ProposalData, value: any) => {
    setProposalData(prev => ({ ...prev, [field]: value }));
  };

  const handleEventChange = (eventId: string, field: keyof Event, value: any) => {
    setProposalData(prev => ({
      ...prev,
      events: prev.events.map(event =>
        event.id === eventId ? { ...event, [field]: value } : event
      )
    }));
  };

  const addEvent = () => {
    const newEvent: Event = {
      id: Date.now().toString(),
      eventTitle: '',
      date: '',
      time: '',
      description: ''
    };
    setProposalData(prev => ({ ...prev, events: [...prev.events, newEvent] }));
  };

  const removeEvent = (eventId: string) => {
    setProposalData(prev => ({ ...prev, events: prev.events.filter(e => e.id !== eventId) }));
  };

  const handleServiceProvidedChange = (serviceId: string, field: keyof ServiceProvided, value: any) => {
    setProposalData(prev => ({
      ...prev,
      servicesProvided: prev.servicesProvided.map(service =>
        service.id === serviceId ? { ...service, [field]: value } : service
      )
    }));
  };

  const addServiceProvided = () => {
    const newService: ServiceProvided = {
      id: Date.now().toString(),
      name: '',
      count: 1
    };
    setProposalData(prev => ({ ...prev, servicesProvided: [...prev.servicesProvided, newService] }));
  };

  const removeServiceProvided = (serviceId: string) => {
    setProposalData(prev => ({ ...prev, servicesProvided: prev.servicesProvided.filter(s => s.id !== serviceId) }));
  };

  const toggleAddOn = (addOnId: string) => {
    setProposalData(prev => ({ ...prev, addOns: prev.addOns.map(a => a.id === addOnId ? { ...a, selected: !a.selected } : a) }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleInputChange('logo', file);
      const reader = new FileReader();
      reader.onload = (event) => setLogoPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const calculateSubtotal = () => {
    const addOnsTotal = proposalData.addOns.filter(a => a.selected).reduce((t, a) => t + a.price, 0);
    return proposalData.totalPrice + addOnsTotal;
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(prev => prev + 1);
  };
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  // --- handleSendProposal ---
  const handleSendProposal = async () => {
    const recipient = (proposalData.recipientEmail || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipient) {
      alert("Please enter the recipient's email address before sending the proposal.");
      return;
    }
    if (!emailRegex.test(recipient)) {
      alert("Please enter a valid recipient email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      let base64Logo: string | undefined;
      if (proposalData.logo) {
        base64Logo = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(proposalData.logo!);
        });
      }

      const payload = {
        ...proposalData,
        leadId: leadId,
        logo: undefined,
        logos: base64Logo ? [base64Logo] : [],
        services: proposalData.servicesProvided, // Map servicesProvided to services for backend
        servicesProvided: undefined, // Remove servicesProvided from payload
        subtotal: calculateSubtotal(),
        total: calculateTotal()
      };

      const response = await fetch(POST_PROPOSAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok || !result.proposalId) {
        throw new Error(result.message || 'Failed to save proposal or did not receive a proposal ID.');
      }

      const newProposalId = result.proposalId;
      const proposalLink = `https://arif-photography-fe.vercel.app/proposals/view/${newProposalId}`;

      const emailPayload = {
        to: recipient,
        subject: `Proposal from ${proposalData.clientName || 'Client'} — #${newProposalId}`,
        proposalId: newProposalId,
        clientName: proposalData.clientName,
        events: proposalData.events,
        services: proposalData.servicesProvided, // Map servicesProvided to services for email
        addOns: proposalData.addOns,
        subtotal: calculateSubtotal(),
        total: calculateTotal(),
        notes: proposalData.footerNote,
        proposalLink
      };

      const sendResponse = await fetch(SENDMAIL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });

      let sendResult: any = { success: sendResponse.ok };
      try {
        sendResult = await sendResponse.json();
      } catch (err) {
        // keep sendResult.success
      }

      if (!sendResponse.ok || !sendResult.success) {
        console.warn('Email send failed on backend:', sendResult);
        alert(`Proposal was created (ID: ${newProposalId}), but sending the email failed. Please send the link manually: ${proposalLink}`);
      } else {
        alert('Proposal saved and email sent successfully!');
      }

      navigate(`/proposals`);
    } catch (error: any) {
      console.error('Error sending proposal:', error);
      alert(`Error: ${error.message || 'An unexpected error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1: return Boolean(proposalData.clientName);
      case 2: return proposalData.events.every(e => e.eventTitle) && proposalData.servicesProvided.every(s => s.name);
      case 3: return proposalData.termsTemplate !== '';
      default: return true;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Clock className="h-8 w-8 animate-spin text-[#00BCEB]" />
        <p className="ml-4 text-xl text-gray-700">Loading Lead / Proposal Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Loading Failed</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/leads')}
            className="flex items-center mx-auto px-4 py-2 bg-[#00BCEB] text-white rounded-lg hover:bg-[#00A5CF] transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header title="Create Proposal" sidebarCollapsed={sidebarCollapsed} />

        <main className="pt-16 p-6">
          <button
            onClick={() => navigate(`/proposals`)}
            className="flex items-center text-[#00BCEB] hover:text-[#00A5CF] mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to proposals
          </button>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h1 className="text-2xl font-bold text-[#2D2D2D] mb-4">Create New Proposal</h1>
              <div className="flex items-center space-x-4">
                {[1,2,3,4].map((num) => {
                  const step = [
                    { number: 1, title: 'Basic Info' },
                    { number: 2, title: 'Events & Services' },
                    { number: 3, title: 'Terms & Branding' },
                    { number: 4, title: 'Preview & Send' }
                  ].find(s => s.number === num)!;
                  return (
                    <div key={step.number} className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${currentStep === step.number ? 'bg-[#00BCEB] text-white' : currentStep > step.number ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {currentStep > step.number ? <Check className="h-4 w-4" /> : step.number}
                      </div>
                      <span className={`ml-2 text-sm font-medium ${currentStep >= step.number ? 'text-[#2D2D2D]' : 'text-gray-500'}`}>{step.title}</span>
                      {step.number < 4 && <div className={`w-12 h-0.5 mx-4 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}`} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {/* STEP 1 */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Client Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-gray-400" /></div>
                        <input type="text" value={proposalData.clientName} onChange={(e)=> handleInputChange('clientName', e.target.value)} className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-[#2D2D2D]" placeholder="Client name"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Shoot Type</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Camera className="h-4 w-4 text-gray-400" /></div>
                        <input type="text" value={proposalData.shootType} onChange={(e)=> handleInputChange('shootType', e.target.value)} className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-[#2D2D2D]" placeholder="e.g. Wedding, Pre-wedding"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Event Date</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="h-4 w-4 text-gray-400" /></div>
                        <input type="date" value={proposalData.eventDate} onChange={(e)=> handleInputChange('eventDate', e.target.value)} className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-[#2D2D2D]"/>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Recipient Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Send className="h-4 w-4 text-gray-400" /></div>
                        <input type="email" value={proposalData.recipientEmail} onChange={(e)=> handleInputChange('recipientEmail', e.target.value)} className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-[#2D2D2D]" placeholder="recipient@example.com"/>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Venue (Optional)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPin className="h-4 w-4 text-gray-400" /></div>
                        <input type="text" value={proposalData.venue} onChange={(e) => handleInputChange('venue', e.target.value)} className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D]" placeholder="Enter venue location"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Notes (Optional)</label>
                      <textarea value={proposalData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} rows={3} className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] resize-none" placeholder="Add any special notes or requirements"/>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 - Events & Services */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4">Event & Services Details</h2>

                  {/* Events */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-[#2D2D2D]">Events</h3>
                      <button onClick={addEvent} className="flex items-center px-3 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00]">
                        <Plus className="h-4 w-4 mr-2" />Add Event
                      </button>
                    </div>

                    {proposalData.events.map((event, index) => (
                      <div key={event.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-[#2D2D2D]">Event {index + 1}</h4>
                          {proposalData.events.length > 1 && (
                            <button onClick={() => removeEvent(event.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Event Title *</label>
                            <input type="text" value={event.eventTitle} onChange={(e) => handleEventChange(event.id, 'eventTitle', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg" placeholder="Event title"/>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Date</label>
                            <input type="date" value={event.date} onChange={(e) => handleEventChange(event.id, 'date', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg"/>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Time</label>
                            <input type="time" value={event.time} onChange={(e) => handleEventChange(event.id, 'time', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg"/>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Description</label>
                            <input type="text" value={event.description} onChange={(e) => handleEventChange(event.id, 'description', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg" placeholder="Event description"/>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Services Provided */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-[#2D2D2D]">Services</h3>
                      <button onClick={addServiceProvided} className="flex items-center px-3 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00]">
                        <Plus className="h-4 w-4 mr-2" />Add Service
                      </button>
                    </div>

                    {proposalData.servicesProvided.map((service, index) => (
                      <div key={service.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-[#2D2D2D]">Service {index + 1}</h4>
                          {proposalData.servicesProvided.length > 1 && (
                            <button onClick={() => removeServiceProvided(service.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Service Name *</label>
                            <input type="text" value={service.name} onChange={(e) => handleServiceProvidedChange(service.id, 'name', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg" placeholder="Service name"/>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Count</label>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => handleServiceProvidedChange(service.id, 'count', Math.max(1, service.count - 1))} 
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                              >
                                -
                              </button>
                              <input type="number" min="1" value={service.count} onChange={(e) => handleServiceProvidedChange(service.id, 'count', parseInt(e.target.value) || 1)} className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-lg text-center"/>
                              <button 
                                onClick={() => handleServiceProvidedChange(service.id, 'count', service.count + 1)} 
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Price / Add-ons / Summary */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-[#2D2D2D]">Total Package Price</h3>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><DollarSign className="h-4 w-4 text-gray-400" /></div>
                        <input 
                          type="number" 
                          min="0" 
                          value={proposalData.totalPrice} 
                          onChange={(e) => handleInputChange('totalPrice', parseInt(e.target.value) || 0)} 
                          className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg" 
                          placeholder="Enter total package price"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-[#2D2D2D]">Optional Add-ons</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {proposalData.addOns.map((addOn) => (
                          <div key={addOn.id} className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${addOn.selected ? 'border-[#00BCEB] bg-[#00BCEB]/5' : 'border-gray-200 hover:border-[#00BCEB]/50'}`} onClick={() => toggleAddOn(addOn.id)}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-[#2D2D2D]">{addOn.name}</p>
                                <p className="text-sm text-gray-600">₹{addOn.price.toLocaleString()}</p>
                              </div>
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addOn.selected ? 'border-[#00BCEB] bg-[#00BCEB]' : 'border-gray-300'}`}>
                                {addOn.selected && <Check className="h-3 w-3 text-white" />}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#00BCEB]/5 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-[#2D2D2D]"><span>Package Price:</span><span>₹{proposalData.totalPrice.toLocaleString()}</span></div>
                      <div className="flex justify-between text-[#2D2D2D]"><span>Add-ons:</span><span>₹{proposalData.addOns.filter(a => a.selected).reduce((t, a) => t + a.price, 0).toLocaleString()}</span></div>
                      <div className="flex justify-between text-lg font-semibold text-[#2D2D2D] pt-2 border-t border-[#00BCEB]/20"><span>Total:</span><span>₹{calculateTotal().toLocaleString()}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 - Terms & Branding */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4">Terms & Branding</h2>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Upload Logo (Optional)</label>
                    {!logoPreview ? (
                      <div onClick={() => document.getElementById('logo-upload')?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#00BCEB] cursor-pointer">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">Click to upload your logo</p>
                        <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                        <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden"/>
                      </div>
                    ) : (
                      <div className="relative inline-block">
                        <img src={logoPreview} alt="Logo preview" className="h-24 w-24 object-contain border border-gray-200 rounded-lg"/>
                        <button onClick={() => {setLogoPreview(null); handleInputChange('logo', null);}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X className="h-4 w-4" /></button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Terms & Conditions Template *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FileText className="h-4 w-4 text-gray-400" /></div>
                      <select value={proposalData.termsTemplate} onChange={(e) => handleInputChange('termsTemplate', e.target.value)} className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg">
                        <option value="">Select a template</option>
                        <option value="standard">Photography Services Terms</option>
                      </select>
                    </div>

                    {proposalData.termsTemplate === 'standard' && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
                        {/* ... (terms content — same as before) */}
                        <h4 className="font-semibold mb-2">Photography Services Terms:</h4>
                        <div className="space-y-3 text-gray-700">
                          <div>
                            <h5 className="font-semibold">Payment Schedule</h5>
                            <p>Our comprehensive wedding photography package is priced at given price, inclusive of all services mentioned above. We propose the following payment schedule:</p>
                            <p><strong>Advance Payment:</strong> 40% of the total billing value to be paid as an advance to block the dates.</p>
                            <p><strong>Delivery Payment:</strong> 50% payment before the wedding Day, Remaining 5% at the Delivery Time and final 5% after the Album finalization.</p>
                            <p><em>NOTE: We will strictly deliver the data only after receiving 95% of the total amount.</em></p>
                          </div>
                          <div>
                            <h5 className="font-semibold">Terms of Service</h5>
                            <p><strong>Travel Expense:</strong> You shall arrange for the travel, Food and accommodation of our shoot crew for all your events occurring in places away from our offices.</p>
                            <p><strong>Project Cancellation:</strong> In the event of cancellation the client is liable to pay the full package cost without eligibility for any discounts or refund. The advance amount for a wedding is non-refundable in the event of cancellation.</p>
                            <p><strong>Event Timings:</strong> Apart from Wedding any event is considered as 4-5 hours for additional coverage need to discuss for adding slot</p>
                            <p><strong>Data Safety:</strong> For Clients who don't collect deliverables within 60 days, we will not hold responsibility for the Data loss.</p>
                            <p><strong>Hard Drives:</strong> A Hard Disk must be provided by the clients.(2 Harddisks has to be provided to the Management Team)</p>
                          </div>
                          <div>
                            <h5 className="font-semibold">Outfits – Best Choices</h5>
                            <p>Clients are advised to prepare 1/2 outfits for the session. (Optional: 3rd outfit based on photography & client requirements.)</p>
                            <p><em>Note: Excessive outfit changes or travel during the shoot may affect the flow and quality of photos. We aim to capture natural, professional moments without interruption.</em></p>
                          </div>
                          <div>
                            <h5 className="font-semibold">Shoot Details – Locations</h5>
                            <p>Clients are responsible for securing access to chosen shoot locations. We are not liable for any closures or restrictions at the selected venues.</p>
                            <p><strong>Pre-Wedding Shoot Duration:</strong> Local shoots: 1-day shoot, Outstation shoots: 2–3 days (includes travel & shoot time)</p>
                          </div>
                          <div>
                            <h5 className="font-semibold">Call Management</h5>
                            <p>In case we are unable to attend your call during client meetings or internal discussions, please feel free to drop us a message on WhatsApp. Our contact team will get back to you as soon as possible.</p>
                          </div>
                          <div>
                            <h5 className="font-semibold">Shoot Timings & Waiting Policy</h5>
                            <p>Clients are requested to arrive at the scheduled shoot time. Waiting time: 15–30 minutes grace period. After 30 minutes, waiting charges will be applicable and added to the final bill.</p>
                          </div>
                          <div>
                            <h5 className="font-semibold">Video & Album Corrections</h5>
                            <p>Clients must request any corrections or changes within 1 week of receiving the final video or album draft. After this period, we will not be responsible for delayed correction requests, and additional charges will apply for any revisions made beyond the 1-week window.</p>
                          </div>
                          <div>
                            <p><em><strong>Note:</strong> We will Strictly adhere to providing only the Requirements listed above, without adding or including any additional elements beyond those specified.</em></p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Footer Note (Optional)</label>
                    <textarea value={proposalData.footerNote} onChange={(e) => handleInputChange('footerNote', e.target.value)} rows={4} className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg" placeholder="Add any personalized message or condition..."/>
                  </div>
                </div>
              )}

              {/* STEP 4 - Preview & Send */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4">Preview & Send</h2>
                  <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        {logoPreview && <img src={logoPreview} alt="Logo" className="h-12 w-auto"/>}
                        <div className="text-right">
                          <h1 className="text-2xl font-bold text-[#2D2D2D]">PROPOSAL</h1>
                          <p className="text-gray-600">#{Date.now().toString().slice(-6)}</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-[#2D2D2D] mb-2">Client Details</h3>
                        <p className="text-[#2D2D2D]">{proposalData.clientName}</p>
                        <p className="text-gray-600">{proposalData.shootType}</p>
                        <p className="text-gray-600">{proposalData.eventDate ? new Date(proposalData.eventDate).toLocaleDateString() : ''}</p>
                        {proposalData.venue && <p className="text-gray-600">{proposalData.venue}</p>}
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Events</h3>
                        <div className="space-y-2">
                          {proposalData.events.map((event) => (
                            <div key={event.id}>
                              <p className="font-medium text-[#2D2D2D]">{event.eventTitle}</p>
                              <p className="text-sm text-gray-600">{event.description}</p>
                              {event.date && <p className="text-sm text-gray-600">Date: {new Date(event.date).toLocaleDateString()}</p>}
                              {event.time && <p className="text-sm text-gray-600">Time: {event.time}</p>}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Services Provided</h3>
                        <div className="space-y-2">
                          {proposalData.servicesProvided.map((service) => (
                            <div key={service.id} className="flex justify-between">
                              <p className="text-[#2D2D2D]">{service.name}</p>
                              <p className="text-sm text-gray-600">Count: {service.count}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {proposalData.addOns.some(a => a.selected) && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Add-ons</h3>
                          <div className="space-y-2">
                            {proposalData.addOns.filter(a => a.selected).map((a) => (
                              <div key={a.id} className="flex justify-between"><p className="text-[#2D2D2D]">{a.name}</p><p className="font-medium text-[#2D2D2D]">₹{a.price.toLocaleString()}</p></div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-4">
                        <div className="flex justify-between mb-2"><span className="text-[#2D2D2D]">Package Price:</span><span className="text-[#2D2D2D]">₹{proposalData.totalPrice.toLocaleString()}</span></div>
                        <div className="flex justify-between mb-2"><span className="text-[#2D2D2D]">Add-ons:</span><span className="text-[#2D2D2D]">₹{proposalData.addOns.filter(a => a.selected).reduce((t, a) => t + a.price, 0).toLocaleString()}</span></div>
                        <div className="flex justify-between text-xl font-bold text-[#2D2D2D] pt-2 border-t"><span>Total:</span><span>₹{calculateTotal().toLocaleString()}</span></div>
                      </div>

                      {proposalData.footerNote && <div className="mt-6 pt-4 border-t"><p className="text-sm text-gray-600">{proposalData.footerNote}</p></div>}
                    </div>
                  </div>
                </div>
              )}

              {/* NAV */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button onClick={prevStep} disabled={currentStep === 1} className={`flex items-center px-4 py-2 rounded-lg font-medium ${currentStep === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-[#2D2D2D] hover:bg-gray-200'}`}><ArrowLeft className="h-4 w-4 mr-2" />Previous</button>
                {currentStep < 4 ? (
                  <button onClick={nextStep} disabled={!isStepValid(currentStep)} className={`flex items-center px-6 py-2 rounded-lg font-medium ${isStepValid(currentStep) ? 'bg-[#00BCEB] text-white hover:bg-[#00A5CF] shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>Next<ArrowRight className="h-4 w-4 ml-2" /></button>
                ) : (
                  <div className="flex items-center space-x-3">
                    <button onClick={() => setCurrentStep(3)} className="px-4 py-2 bg-gray-100 text-[#2D2D2D] rounded-lg">Go Back</button>
                    <button
                      onClick={handleSendProposal}
                      disabled={isSubmitting || !proposalData.recipientEmail}
                      title={!proposalData.recipientEmail ? "Cannot send proposal: Recipient email is missing." : "Send Proposal"}
                      className={`flex items-center px-6 py-2 rounded-lg font-medium ${(!isSubmitting && proposalData.recipientEmail) ? 'bg-[#00BCEB] text-white hover:bg-[#00A5CF] shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    >
                      {isSubmitting ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Sending...</>) : (<><Send className="h-4 w-4 mr-2" />Send Proposal</>)}
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ProposalCreate;
