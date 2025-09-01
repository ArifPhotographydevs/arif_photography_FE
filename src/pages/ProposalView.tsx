import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Camera, 
  Check, 
  Edit3, 
  X, 
  MessageCircle, 
  Star,
  ChevronRight,
  ChevronDown,
  Clock,
  Quote,
  Sparkles,
  Heart,
  Sun,
  Moon,
  Send,
  Phone,
  Instagram,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  CheckCircle,
  XCircle
} from 'lucide-react';

const UPDATE_STATUS_URL = 'https://e419qsiwvk.execute-api.eu-north-1.amazonaws.com/updateproposalStatus';
const GET_ALL_URL = 'https://av8kc9cjeh.execute-api.eu-north-1.amazonaws.com/GetAllProposalsData';

function normalizeLeadId(input?: string): string {
  if (!input) return '';
  return input.startsWith('LEAD#') ? input.slice('LEAD#'.length) : input;
}

function apiStatusFromUI(status: string): string {
  switch (status) {
    case 'accepted': return 'Accepted';
    case 'declined': return 'Rejected';
    case 'revision_requested': return 'RevisionRequested';
    default: return 'pending';
  }
}

function uiStatusFromAPI(raw?: string): string {
  if (!raw) return 'pending';
  const s = raw.toLowerCase();
  if (s === 'accepted') return 'accepted';
  if (s === 'rejected' || s === 'declined') return 'declined';
  if (s === 'revisionrequested' || s === 'revision_requested') return 'revision_requested';
  return 'pending';
}

interface Service {
  title: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface AddOn { 
  name: string; 
  price: number; 
}

interface ProposalData {
  id: string;
  leadId: string;
  clientName: string;
  shootType: string;
  eventDate: string;
  venue: string;
  services: Service[];
  addOns: AddOn[];
  gstEnabled: boolean;
  customNotes: string;
  timeline: Array<{ phase: string; description: string; duration: string; }>;
  status: string;
  latestRevisionNote?: string;
  revisionHistory?: Array<{ note: string; at: string }>;
}

function ProposalView() {
  const { id: proposalId } = useParams();   
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [proposalStatus, setProposalStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const heroRef = useRef(null);
  const carouselRef = useRef(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const portfolioImages = [
    'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/380768/pexels-photo-380768.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  ];

  const testimonials = [
    { name: 'Priya & Raj', feedback: 'Arif captured our wedding beautifully! Every moment was perfect and the photos exceeded our expectations.', rating: 5 },
    { name: 'Emma Wilson', feedback: 'Professional, creative, and so easy to work with. Our maternity shoot was absolutely stunning!', rating: 5 },
    { name: 'The Sharma Family', feedback: 'Our family portraits turned out magical! Arif has an incredible eye for capturing genuine emotions.', rating: 5 }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const resp = await fetch(GET_ALL_URL);
        const data = await resp.json();
        const proposals = Array.isArray(data) ? data : data.proposals || [];
        const matched = proposals.find(
          (item: any) => item.proposalId?.toString().trim() === proposalId?.toString().trim()
        );
        
        if (!matched) {
          console.warn('No matching proposal found for proposalId:', proposalId);
          setProposal(null);
          return;
        }

        const leadIdRaw = matched.leadId || matched.PK || matched.pk || '';
        const leadId = normalizeLeadId(
          typeof leadIdRaw === 'string' ? leadIdRaw : String(leadIdRaw)
        );

        const mapped: ProposalData = {
          id: matched.proposalId,
          leadId,
          clientName: matched.clientName,
          shootType: matched.shootType,
          eventDate: matched.eventDate,
          venue: matched.venue || '',
          services: (matched.services || []).map((s: any) => ({
            title: s.title,
            description: s.description || '',
            quantity: Number(s.quantity || 0),
            unitPrice: Number(s.unitPrice || 0),
          })),
          addOns: (matched.addOns || [])
            .filter((a: any) => a.selected)
            .map((a: any) => ({ name: a.name, price: Number(a.price || 0) })),
          gstEnabled: !!matched.gstEnabled,
          customNotes: matched.notes || '',
          timeline: [], 
          status: uiStatusFromAPI(matched.status),
          latestRevisionNote: matched.latestRevisionNote,
          revisionHistory: Array.isArray(matched.revisionHistory) ? matched.revisionHistory : undefined,
        };

        setProposal(mapped);
        setProposalStatus(mapped.status);
      } catch (e) {
        console.error('Failed to fetch proposal:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchProposal();
  }, [proposalId]);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % portfolioImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const calculateSubtotal = () => {
    if (!proposal) return 0;
    const servicesTotal = proposal.services.reduce((total, s) => total + (s.quantity * s.unitPrice), 0);
    const addOnsTotal = proposal.addOns.reduce((t, a) => t + a.price, 0);
    return servicesTotal + addOnsTotal;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const gstAmount = proposal?.gstEnabled ? subtotal * 0.18 : 0;
    return subtotal + gstAmount;
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  async function updateStatus(next: string, extraNotes?: string) {
    if (!proposal) return;
    const payload: any = {
      leadId: proposal.leadId,
      proposalId: proposal.id,
      status: apiStatusFromUI(next),
    };

    if (next === 'revision_requested' && extraNotes?.trim()) {
      payload.revisionNotes = extraNotes.trim();
    }

    const prev = proposalStatus;
    setProposalStatus(next);
    setBusy(true);

    try {
      const res = await fetch(UPDATE_STATUS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const body = await res.json().catch(() => ({} as any));
      
      if (!res.ok) {
        setProposalStatus(prev);
        const msg = body?.error || `Failed to update status (${res.status})`;
        showToastMessage(msg);
        console.error('Update failed:', body);
        return;
      }

      const updated = body?.updated || {};
      const nextStatus = uiStatusFromAPI(updated?.status) || next;
      setProposalStatus(nextStatus);
      
      setProposal((p) =>
        p
          ? {
              ...p,
              status: nextStatus,
              latestRevisionNote: updated?.latestRevisionNote ?? p.latestRevisionNote,
              revisionHistory: Array.isArray(updated?.revisionHistory)
                ? updated.revisionHistory
                : p.revisionHistory,
            }
          : p
      );

      try {
        const projectCreationPayload = {
          proposalId: proposal.id,
          leadId: proposal.leadId,
          status: apiStatusFromUI(next),
          clientName: proposal.clientName,
          shootType: proposal.shootType,
          eventDate: proposal.eventDate,
          venue: proposal.venue,
        };
        
        const projectRes = await fetch('https://mk93vwf9k3.execute-api.eu-north-1.amazonaws.com/default/Post_Project_Creation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectCreationPayload),
        });
        
        const projectBody = await projectRes.json().catch(() => ({} as any));
        
        if (!projectRes.ok) {
          console.error('Post_Project_Creation failed:', projectBody);
          showToastMessage('Status updated, but failed to trigger project creation.');
          return;
        }
        
        showToastMessage(`Status updated to ${nextStatus.replace('_', ' ')} and project creation triggered.`);
      } catch (projectErr) {
        console.error('Post_Project_Creation network error:', projectErr);
        showToastMessage('Status updated, but failed to trigger project creation due to network error.');
      }
    } catch (err) {
      setProposalStatus(prev);
      console.error('Update status error:', err);
      showToastMessage('Network error while updating status.');
    } finally {
      setBusy(false);
    }
  }

  const handleAccept = () => updateStatus('accepted');
  const handleDecline = () => updateStatus('declined');
  const handleRevisionRequest = async () => {
    if (!revisionNotes.trim()) return;
    setShowRevisionModal(false);
    const notes = revisionNotes.trim();
    setRevisionNotes('');
    await updateStatus('revision_requested', notes);
  };

  const handleWhatsApp = () => {
    if (!proposal) return;
    const message = `Hi! I'm interested in the ${proposal.shootType} proposal for ${new Date(proposal.eventDate).toLocaleDateString()}. Can we discuss further?`;
    const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusColor = () => {
    switch (proposalStatus) {
      case 'accepted': return 'text-green-500';
      case 'declined': return 'text-red-500';
      case 'revision_requested': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (proposalStatus) {
      case 'accepted': return 'Accepted ✅';
      case 'declined': return 'Declined ❌';
      case 'revision_requested': return 'Revision Requested ✏️';
      default: return 'Pending Review';
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-white text-2xl">Loading proposal...</div></div>;
  if (!proposal) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-red-400 text-2xl">Proposal not found.</div></div>;

  return (
    <div className="min-h-screen bg-gray-900 overflow-x-hidden">
      {/* Animated Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'bg-gray-900 shadow-2xl shadow-gray-800' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className={`font-bold text-xl transition-all duration-300 ${
                  isScrolled ? 'text-white' : 'text-white'
                }`}>Arif Photography</h1>
                <p className={`text-xs transition-all duration-300 ${
                  isScrolled ? 'text-gray-400' : 'text-gray-300'
                }`}>Capturing Your Precious Moments</p>
              </div>
            </div>
            <div className={`flex items-center space-x-3 px-6 py-3 rounded-full transition-all duration-500 ${
              isScrolled 
                ? 'bg-gray-800 text-gray-300' 
                : 'bg-black/30 text-white'
            }`}>
              <div className={`w-3 h-3 rounded-full mr-2 animate-pulse ${
                proposalStatus === 'accepted' ? 'bg-green-400' : 
                proposalStatus === 'declined' ? 'bg-red-400' : 
                proposalStatus === 'revision_requested' ? 'bg-orange-400' : 'bg-gray-400'
              }`}></div>
              <span className="font-medium text-sm">{getStatusText()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section with Scrolling Carousel */}
      <div ref={heroRef} className="relative h-screen overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 z-10"></div>
        
        {/* Image Carousel */}
        <div ref={carouselRef} className="absolute inset-0">
          {portfolioImages.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img 
                src={img} 
                alt={`Portfolio ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
          {portfolioImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentImageIndex 
                  ? 'bg-white' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center z-20 px-6">
          <div className="text-center text-white max-w-4xl">
            <div className="mb-8">
  <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight text-white">
    Your Story, Perfectly Framed
  </h1>
  <p className="text-xl md:text-2xl opacity-90 mb-8 leading-relaxed text-black">
    Where every moment becomes a masterpiece
  </p>
</div>

            
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm md:text-base opacity-90 mb-12">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                <Heart className="h-5 w-5 text-pink-300" />
                <span>500+ Happy Clients</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                <Camera className="h-5 w-5 text-blue-300" />
                <span>10+ Years Experience</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                <Sun className="h-5 w-5 text-orange-300" />
                <span>Award-Winning Photographer</span>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="flex flex-col items-center animate-bounce">
              <span className="text-white text-sm mb-2 opacity-70">Scroll to explore your proposal</span>
              <ChevronDown className="h-8 w-8 text-white opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-8">
        {/* Greeting Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-blue-400/20 to-orange-500/20 px-8 py-4 rounded-full border border-blue-400/30 mb-8">
            <Sparkles className="h-6 w-6 text-blue-400 animate-spin" />
            <span className="text-blue-400 font-bold text-xl">Personalized Proposal for {proposal.clientName}</span>
            <Sparkles className="h-6 w-6 text-orange-400 animate-spin" style={{animationDirection: 'reverse'}} />
          </div>
          <h2 className="text-4xl font-bold text-white mb-6">
            We're honored to capture your special moments
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Every photograph tells a story. Let's create a timeless narrative of your most precious moments together.
          </p>
        </div>

        {/* Project Overview */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl p-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-2xl">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-white">Project Overview</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-2xl border border-blue-400/30 hover:border-blue-400/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-400/20">
              <div className="w-16 h-16 bg-blue-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-blue-400" />
              </div>
              <h4 className="font-bold text-white text-xl mb-2">Shoot Type</h4>
              <p className="text-blue-400 font-extrabold text-2xl">{proposal.shootType}</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl border border-blue-400/30 hover:border-blue-400/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-400/20">
              <div className="w-16 h-16 bg-blue-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-blue-400" />
              </div>
              <h4 className="font-bold text-white text-xl mb-2">Event Date</h4>
              <p className="text-blue-400 font-extrabold text-2xl">
                {new Date(proposal.eventDate).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </p>
            </div>
            
            <div className="text-center p-6 rounded-2xl border border-orange-400/30 hover:border-orange-400/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-400/20">
              <div className="w-16 h-16 bg-orange-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-orange-400" />
              </div>
              <h4 className="font-bold text-white text-xl mb-2">Venue</h4>
              <p className="text-orange-400 font-extrabold text-2xl">{proposal.venue}</p>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl p-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-2xl">
              <span className="text-white text-2xl font-bold">₹</span>
            </div>
            <h3 className="text-3xl font-bold text-white">Your Investment</h3>
          </div>
          
          <div className="space-y-6 mb-8">
            {proposal.services.map((service, index) => (
              <div key={index} className="flex flex-col lg:flex-row justify-between items-start p-6 bg-gradient-to-r from-gray-800/70 to-gray-700/70 rounded-2xl border border-gray-600/50 hover:border-blue-400/50 transition-all duration-500 hover:scale-102 hover:shadow-2xl">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-400/20 rounded-full flex items-center justify-center">
                      <Camera className="h-6 w-6 text-blue-400" />
                    </div>
                    <h4 className="font-bold text-white text-xl">{service.title}</h4>
                  </div>
                  <p className="text-gray-300 mb-2 text-base">{service.description}</p>
                  <p className="text-gray-400 text-base">Quantity: {service.quantity}</p>
                </div>
                <div className="text-right mt-4 lg:mt-0">
                  <p className="font-extrabold text-blue-400 text-2xl">₹{(service.quantity * service.unitPrice).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          
          {proposal.addOns.length > 0 && (
            <div className="mb-8">
              <h4 className="font-bold text-white text-2xl mb-6 flex items-center">
                <Sparkles className="h-6 w-6 text-orange-400 mr-3" />
                Selected Premium Add-ons
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proposal.addOns.map((addOn, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-400/15 to-orange-500/15 rounded-2xl border border-orange-400/30 hover:border-orange-400/60 transition-all duration-500 hover:shadow-lg">
                    <div className="flex items-center space-x-3">
                      <Sparkles className="h-5 w-5 text-orange-400" />
                      <span className="text-white font-bold text-lg">{addOn.name}</span>
                    </div>
                    <span className="font-extrabold text-orange-400 text-xl">₹{addOn.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="border-t-2 border-gray-600 pt-8 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-white text-lg">
              <span className="font-bold mb-2 sm:mb-0">Subtotal:</span>
              <span className="font-extrabold">₹{calculateSubtotal().toLocaleString()}</span>
            </div>
            
            {proposal.gstEnabled && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-white text-lg">
                <span className="font-bold mb-2 sm:mb-0">GST (18%):</span>
                <span className="font-extrabold">₹{(calculateSubtotal() * 0.18).toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-6 border-t-2 border-blue-400/50">
              <div className="flex items-center mb-4 sm:mb-0">
                <Sparkles className="h-8 w-8 text-orange-400 mr-3" />
                <span className="font-extrabold text-white text-2xl">Total Investment:</span>
              </div>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-500 font-extrabold text-3xl">₹{calculateTotal().toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {proposal.timeline.length > 0 && (
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl p-8">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-2xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white">Project Timeline</h3>
            </div>
            
            <div className="space-y-6">
              {proposal.timeline.map((phase, index) => (
                <div key={index} className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-2xl">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 p-6 bg-gradient-to-r from-gray-800/70 to-gray-700/70 rounded-2xl border border-gray-600/50 hover:border-blue-400/50 transition-all duration-500 hover:shadow-2xl">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <h4 className="font-extrabold text-white text-xl">{phase.phase}</h4>
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-400/20 to-blue-500/20 text-blue-400 border border-blue-400/30">
                        <Clock className="h-4 w-4 mr-2" />
                        {phase.duration}
                      </span>
                    </div>
                    <p className="text-gray-300 text-base leading-relaxed">{phase.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change Request History */}
        {(proposal.revisionHistory?.length || proposal.latestRevisionNote) && (() => {
          const history = (proposal.revisionHistory && proposal.revisionHistory.length > 0)
            ? proposal.revisionHistory
            : [{ note: proposal.latestRevisionNote as string, at: '' }];
          
          const sorted = [...history].sort((a, b) => {
            const ta = a.at ? new Date(a.at).getTime() : 0;
            const tb = b.at ? new Date(b.at).getTime() : 0;
            return ta - tb;
          });
          
          return (
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-2xl">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">Change Request History</h3>
                </div>
                <span className="inline-flex items-center px-6 py-3 rounded-full text-sm font-bold bg-gradient-to-r from-blue-400/20 to-orange-500/20 text-orange-400 border border-orange-400/30">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {sorted.length} message{sorted.length > 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="space-y-6">
                {sorted.map((h, idx) => (
                  <div key={`${idx}-${h.at}`} className="flex items-start gap-4">
                    <div className="w-4 h-4 mt-4 rounded-full bg-orange-400 shadow-lg"></div>
                    <div className="flex-1">
                      <div className="bg-gradient-to-r from-blue-400/15 to-orange-500/15 border-2 border-orange-400/30 rounded-2xl p-6 shadow-lg">
                        <p className="text-white leading-relaxed text-lg">{h.note}</p>
                      </div>
                      <div className="mt-3 text-xs text-gray-400 font-medium">
                        {h.at ? new Date(h.at).toLocaleString() : '—'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Custom Notes */}
        {proposal.customNotes && (
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl p-8">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-2xl">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white">Personal Message</h3>
            </div>
            
            <div className="bg-gradient-to-r from-blue-400/15 to-orange-500/15 rounded-2xl p-8 border-2 border-blue-400/30">
              <div className="flex items-start space-x-4">
                <Heart className="h-8 w-8 text-orange-400 mt-1 flex-shrink-0 animate-pulse" />
                <p className="text-white leading-relaxed text-lg">{proposal.customNotes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Testimonials */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl p-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-2xl">
              <Quote className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-white">What Our Clients Say</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-800/70 to-gray-700/70 rounded-2xl p-6 border border-gray-600/50 hover:border-blue-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center mb-4">
                  <div className="flex text-orange-400 mr-3">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <span className="font-extrabold text-white text-xl">{t.name}</span>
                </div>
                <div className="flex items-start">
                  <Quote className="h-8 w-8 text-gray-400 mr-4 flex-shrink-0 mt-1" />
                  <p className="text-gray-300 italic text-lg leading-relaxed">{t.feedback}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl p-8">
          <button onClick={() => setShowTerms(!showTerms)} className="flex items-center justify-between w-full text-left">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-2xl">
                <ChevronRight className="h-6 w-6 text-white transition-transform duration-500" style={{transform: showTerms ? 'rotate(90deg)' : 'rotate(0deg)'}} />
              </div>
              <h3 className="text-3xl font-bold text-white">Terms & Conditions</h3>
            </div>
            <ChevronDown className="h-8 w-8 text-gray-400 transition-transform duration-500" style={{transform: showTerms ? 'rotate(180deg)' : 'rotate(0deg)'}} />
          </button>
          
          {showTerms && (
            <div className="mt-8 p-8 bg-gradient-to-r from-gray-800/70 to-gray-700/70 rounded-2xl border-2 border-gray-600/50 max-h-96 overflow-y-auto shadow-inner">
              <div className="text-white space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <strong className="text-lg">1. Payment Terms:</strong>
                    <p className="text-gray-300 mt-2 text-base">50% advance payment required to confirm booking. Balance payment due on delivery of final images.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                    <X className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <strong className="text-lg">2. Cancellation Policy:</strong>
                    <p className="text-gray-300 mt-2 text-base">Cancellations made 30 days prior to event date will receive full refund minus processing fees. Within 30 days, 50% of advance payment is non-refundable.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <strong className="text-lg">3. Delivery Timeline:</strong>
                    <p className="text-gray-300 mt-2 text-base">Edited photos will be delivered within 4 weeks of the event date. Premium packages receive priority editing.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <strong className="text-lg">4. Usage Rights:</strong>
                    <p className="text-gray-300 mt-2 text-base">Client receives full usage rights for personal use and social media sharing. Commercial usage requires separate agreement.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                    <Sun className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <strong className="text-lg">5. Weather Policy:</strong>
                    <p className="text-gray-300 mt-2 text-base">In case of extreme weather conditions, outdoor shoots may be rescheduled at no additional cost. We always have backup indoor options.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                    <span className="text-white text-sm font-bold">E</span>
                  </div>
                  <div>
                    <strong className="text-lg">6. Equipment & Safety:</strong>
                    <p className="text-gray-300 mt-2 text-base">We use professional-grade equipment with multiple backup systems to ensure no loss of coverage. All equipment is regularly maintained and insured.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {(['pending', 'revision_requested'] as string[]).includes(proposalStatus) && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-800 to-transparent border-t border-gray-700/50 p-6 z-40">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={handleAccept}
                disabled={busy}
                className={`flex items-center justify-center px-8 py-4 rounded-2xl font-extrabold text-lg transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-3xl ${
                  busy 
                    ? 'bg-blue-400/60 cursor-not-allowed text-white' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/50'
                }`}
              >
                <CheckCircle className="h-6 w-6 mr-3" />
                {busy ? 'Processing...' : 'Accept & Book'}
              </button>
              
              <button
                onClick={() => setShowRevisionModal(true)}
                disabled={busy}
                className="flex items-center justify-center px-8 py-4 border-4 border-orange-400 text-orange-400 rounded-2xl font-extrabold text-lg hover:bg-orange-400 hover:text-white transition-all duration-500 transform hover:scale-105 disabled:opacity-60 shadow-lg hover:shadow-orange-400/30"
              >
                <MessageSquare className="h-6 w-6 mr-3" />
                Request Changes
              </button>
              
              <button
                onClick={handleDecline}
                disabled={busy}
                className="flex items-center justify-center px-8 py-4 border-4 border-red-500 text-red-500 rounded-2xl font-extrabold text-lg hover:bg-red-500 hover:text-white transition-all duration-500 transform hover:scale-105 disabled:opacity-60 shadow-lg hover:shadow-red-500/30"
              >
                <XCircle className="h-6 w-6 mr-3" />
                Decline
              </button>
              
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-extrabold text-lg hover:from-green-600 hover:to-green-700 transition-all duration-500 transform hover:scale-105 shadow-lg hover:shadow-green-500/50"
              >
                <MessageCircle className="h-6 w-6 mr-3" />
                WhatsApp Us
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Request Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-500 scale-100 border border-gray-700">
            <div className="p-8">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-2xl">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white">Request Changes</h3>
              </div>
              
              <p className="text-gray-300 mb-6 text-lg">Please let us know what changes you'd like to see in the proposal:</p>
              
              <textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                rows={5}
                className="w-full px-6 py-4 bg-gray-700 border-4 border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 resize-none text-lg"
                placeholder="Describe the changes you'd like... Be as specific as possible about what you'd like to modify. We're here to make this perfect for you!"
              />
              
              <div className="flex items-center justify-end space-x-4 mt-8">
                <button
                  onClick={() => setShowRevisionModal(false)}
                  className="px-8 py-3 text-white bg-gray-700 hover:bg-gray-600 rounded-2xl font-extrabold text-lg transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevisionRequest}
                  disabled={!revisionNotes.trim() || busy}
                  className={`px-10 py-3 rounded-2xl font-extrabold text-lg transition-all duration-500 ${
                    revisionNotes.trim() && !busy
                      ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600 transform hover:scale-105 shadow-lg hover:shadow-orange-400/50'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {busy ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed top-8 right-8 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 animate-fade-in border border-green-700">
          <div className="flex items-center">
            <Check className="h-6 w-6 mr-4" />
            <p className="font-extrabold text-lg">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(180deg); }
          100% { transform: translateY(0px) rotate(360deg); }
        }
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        .animate-bounce {
          animation: bounce 1.5s ease-in-out infinite;
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default ProposalView;