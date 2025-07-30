import React, { useEffect, useState } from 'react';
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
  User,
  Clock,
  Image,
  FileText,
  DollarSign,
  Quote
} from 'lucide-react';

interface ProposalData {
  id: string;
  clientName: string;
  shootType: string;
  eventDate: string;
  venue: string;
  services: Array<{
    title: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  addOns: Array<{
    name: string;
    price: number;
  }>;
  gstEnabled: boolean;
  customNotes: string;
  timeline: Array<{
    phase: string;
    description: string;
    duration: string;
  }>;
  status: 'pending' | 'accepted' | 'declined' | 'revision_requested';
}

function ProposalView() {
  const [proposalStatus, setProposalStatus] = useState<'pending' | 'accepted' | 'declined' | 'revision_requested'>('pending');
  const [showTerms, setShowTerms] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
    const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const { id: proposalId } = useParams();   

  // Mock proposal data
useEffect(() => {
  const fetchProposal = async () => {
    try {
      const response = await fetch('https://av8kc9cjeh.execute-api.eu-north-1.amazonaws.com/GetAllProposalsData');
      const data = await response.json();

      console.log("Fetched proposalId from URL:", proposalId);
      console.log("API response:", data);

      const proposals = Array.isArray(data) ? data : data.proposals || [];

      const matched = proposals.find(
        (item: any) => item.proposalId?.toString().trim() === proposalId?.toString().trim()
      );

      if (!matched) {
        console.warn('No matching proposal found for proposalId:', proposalId);
      }

      if (matched) {
        const mapped: ProposalData = {
          id: matched.proposalId,
          clientName: matched.clientName,
          shootType: matched.shootType,
          eventDate: matched.eventDate,
          venue: matched.venue || '',
          services: matched.services.map((s: any) => ({
            title: s.title,
            description: s.description || '',
            quantity: s.quantity,
            unitPrice: s.unitPrice
          })),
          addOns: matched.addOns
            .filter((a: any) => a.selected)
            .map((a: any) => ({ name: a.name, price: a.price })),
          gstEnabled: matched.gstEnabled,
          customNotes: matched.notes || '',
          timeline: [], // You can fill this if available in API
          status: 'pending'
        };

        setProposal(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchProposal();
}, [proposalId]);

  const portfolioImages = [
    'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=400'
  ];

  const testimonials = [
    {
      name: 'Priya & Raj',
      feedback: 'Arif captured our wedding beautifully! Every moment was perfect and the photos exceeded our expectations.',
      rating: 5
    },
    {
      name: 'Emma Wilson',
      feedback: 'Professional, creative, and so easy to work with. Our maternity shoot was absolutely stunning!',
      rating: 5
    }
  ];

  const calculateSubtotal = () => {
    const servicesTotal = proposal.services.reduce((total, service) => 
      total + (service.quantity * service.unitPrice), 0
    );
    const addOnsTotal = proposal.addOns.reduce((total, addOn) => total + addOn.price, 0);
    return servicesTotal + addOnsTotal;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const gstAmount = proposal.gstEnabled ? subtotal * 0.18 : 0;
    return subtotal + gstAmount;
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAccept = () => {
    setProposalStatus('accepted');
    showToastMessage('Proposal accepted! We\'ll be in touch soon.');
  };

  const handleDecline = () => {
    setProposalStatus('declined');
    showToastMessage('Proposal declined. Thank you for considering us.');
  };

  const handleRevisionRequest = () => {
    if (revisionNotes.trim()) {
      setProposalStatus('revision_requested');
      setShowRevisionModal(false);
      setRevisionNotes('');
      showToastMessage('Revision request sent! We\'ll get back to you soon.');
    }
  };

  const handleWhatsApp = () => {
    const message = `Hi! I'm interested in the ${proposal.shootType} proposal for ${new Date(proposal.eventDate).toLocaleDateString()}. Can we discuss further?`;
    const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusColor = () => {
    switch (proposalStatus) {
      case 'accepted': return 'text-green-600';
      case 'declined': return 'text-red-600';
      case 'revision_requested': return 'text-yellow-600';
      default: return 'text-gray-600';
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

if (loading) {
  return <div className="text-center p-10 text-gray-500">Loading proposal...</div>;
}

if (!proposal) {
  return <div className="text-center p-10 text-red-500">Proposal not found.</div>;
}

return (

    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00BCEB] to-[#00A5CF] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#2D2D2D]">Arif Photography</h1>
                <p className="text-sm text-gray-600">Proposal #{proposal.id}</p>
              </div>
            </div>
            <div className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Greeting Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2">Hi {proposal.clientName} 👋</h2>
          <p className="text-gray-600 text-lg">Here's your personalized shoot proposal</p>
        </div>

        {/* Project Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-[#2D2D2D] mb-4">Project Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#00BCEB]/10 rounded-full flex items-center justify-center">
                <Camera className="h-5 w-5 text-[#00BCEB]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Shoot Type</p>
                <p className="font-medium text-[#2D2D2D]">{proposal.shootType}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[#FF6B00]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Event Date</p>
                <p className="font-medium text-[#2D2D2D]">
                  {new Date(proposal.eventDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#00BCEB]/10 rounded-full flex items-center justify-center">
                <MapPin className="h-5 w-5 text-[#00BCEB]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Venue</p>
                <p className="font-medium text-[#2D2D2D]">{proposal.venue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-[#2D2D2D] mb-4">Package Details</h3>
          
          {/* Services */}
          <div className="space-y-4 mb-6">
            {proposal.services.map((service, index) => (
              <div key={index} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-[#2D2D2D]">{service.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                  <p className="text-sm text-gray-500 mt-1">Quantity: {service.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#2D2D2D]">₹{(service.quantity * service.unitPrice).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add-ons */}
          {proposal.addOns.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-[#2D2D2D] mb-3">Selected Add-ons</h4>
              <div className="space-y-2">
                {proposal.addOns.map((addOn, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-[#FF6B00]/5 rounded-lg">
                    <span className="text-[#2D2D2D]">{addOn.name}</span>
                    <span className="font-medium text-[#2D2D2D]">₹{addOn.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-[#2D2D2D]">
              <span>Subtotal:</span>
              <span>₹{calculateSubtotal().toLocaleString()}</span>
            </div>
            {proposal.gstEnabled && (
              <div className="flex justify-between text-[#2D2D2D]">
                <span>GST (18%):</span>
                <span>₹{(calculateSubtotal() * 0.18).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-[#2D2D2D] pt-2 border-t">
              <span>Total Amount:</span>
              <span className="text-[#00BCEB]">₹{calculateTotal().toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-[#2D2D2D] mb-4">Project Timeline</h3>
          <div className="space-y-4">
            {proposal.timeline.map((phase, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-[#00BCEB]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-[#00BCEB]" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-[#2D2D2D]">{phase.phase}</h4>
                  <p className="text-sm text-gray-600 mt-1">{phase.description}</p>
                  <p className="text-xs text-[#FF6B00] mt-1 font-medium">{phase.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Gallery */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-[#2D2D2D] mb-4">Our Recent Work</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {portfolioImages.map((image, index) => (
              <div key={index} className="aspect-square rounded-lg overflow-hidden">
                <img
                  src={image}
                  alt={`Portfolio ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                />
              </div>
            ))}
          </div>
          <button className="text-[#00BCEB] hover:text-[#00A5CF] font-medium text-sm flex items-center">
            View Full Portfolio
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>

        {/* Custom Notes */}
        {proposal.customNotes && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-semibold text-[#2D2D2D] mb-4">Personal Message</h3>
            <div className="bg-[#00BCEB]/5 rounded-lg p-4">
              <p className="text-[#2D2D2D] leading-relaxed">{proposal.customNotes}</p>
            </div>
          </div>
        )}

        {/* Testimonials */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-[#2D2D2D] mb-4">What Our Clients Say</h3>
          <div className="space-y-4">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="flex text-yellow-400">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <span className="ml-2 font-medium text-[#2D2D2D]">{testimonial.name}</span>
                </div>
                <div className="flex items-start">
                  <Quote className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0 mt-1" />
                  <p className="text-gray-600 italic">{testimonial.feedback}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <button
            onClick={() => setShowTerms(!showTerms)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-xl font-semibold text-[#2D2D2D]">Terms & Conditions</h3>
            {showTerms ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {showTerms && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>1. Payment Terms:</strong> 50% advance payment required to confirm booking. Balance payment due on delivery.</p>
                <p><strong>2. Cancellation Policy:</strong> Cancellations made 30 days prior to event date will receive full refund minus processing fees.</p>
                <p><strong>3. Delivery Timeline:</strong> Edited photos will be delivered within 4 weeks of the event date.</p>
                <p><strong>4. Usage Rights:</strong> Client receives full usage rights for personal use. Commercial usage requires separate agreement.</p>
                <p><strong>5. Weather Policy:</strong> In case of extreme weather conditions, shoot may be rescheduled at no additional cost.</p>
                <p><strong>6. Equipment:</strong> We use professional-grade equipment with backup systems to ensure no loss of coverage.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Fixed at bottom on mobile */}
      {proposalStatus === 'pending' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:relative md:border-t-0 md:bg-transparent md:p-0">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <button
                onClick={handleAccept}
                className="flex items-center justify-center px-6 py-3 bg-[#00BCEB] text-white rounded-lg font-medium hover:bg-[#00A5CF] transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <Check className="h-4 w-4 mr-2" />
                Accept Proposal
              </button>
              
              <button
                onClick={() => setShowRevisionModal(true)}
                className="flex items-center justify-center px-6 py-3 border-2 border-[#FF6B00] text-[#FF6B00] rounded-lg font-medium hover:bg-[#FF6B00] hover:text-white transition-colors duration-200"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Request Changes
              </button>
              
              <button
                onClick={handleDecline}
                className="flex items-center justify-center px-6 py-3 border-2 border-red-500 text-red-500 rounded-lg font-medium hover:bg-red-500 hover:text-white transition-colors duration-200"
              >
                <X className="h-4 w-4 mr-2" />
                Decline
              </button>
              
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center px-6 py-3 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp Us
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Request Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-[#2D2D2D] mb-4">Request Changes</h3>
              <p className="text-gray-600 mb-4">Please let us know what changes you'd like to see in the proposal:</p>
              <textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200 resize-none"
                placeholder="Describe the changes you'd like..."
              />
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRevisionModal(false)}
                  className="px-4 py-2 text-[#2D2D2D] bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevisionRequest}
                  disabled={!revisionNotes.trim()}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    revisionNotes.trim()
                      ? 'bg-[#FF6B00] text-white hover:bg-[#e55a00]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <p className="font-medium">{toastMessage}</p>
        </div>
      )}

      {/* Bottom padding for mobile fixed buttons */}
      {proposalStatus === 'pending' && (
        <div className="h-20 md:h-0"></div>
      )}
    </div>
  );
}

export default ProposalView;