import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, Video } from 'lucide-react';

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

interface TimelineItem {
  phase: string;
  description: string;
  duration: string;
  services?: Array<{
    name?: string;
    count?: number;
    id?: string;
  }>;
}

interface PackageItem {
  id: string;
  name: string;
  selected: boolean;
  qty: number;
  unitPrice?: number;
}

interface ComplimentaryItem {
  id: string;
  name: string;
  selected: boolean;
  qty: number;
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
  timeline: TimelineItem[];
  status: string;
  latestRevisionNote?: string;
  revisionHistory?: Array<{ note: string; at: string }>;
  subtotal?: number;
  total?: number;
  termsTemplate?: string;
  footerNote?: string;
  logos?: string[];
  packageItems?: PackageItem[];
  complimentaryItems?: ComplimentaryItem[];
  albumsCount?: number;
  albumSheets?: number;
}

interface ApiProposalItem {
  proposalId: string;
  leadId?: string;
  PK?: string;
  pk?: string;
  clientName: string;
  shootType?: string;
  eventDate?: string;
  venue?: string;
  events?: Array<{
    id?: string;
    eventTitle?: string;
    date?: string;
    time?: string;
    description?: string;
    services?: Array<{
      name?: string;
      count?: number;
      id?: string;
    }>;
  }>;
  services?: Array<{
    name?: string;
    count?: number;
    id?: string;
    title?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
  }>;
  addOns?: Array<{
    name?: string;
    price?: number;
    selected?: boolean;
  }>;
  gstEnabled?: boolean;
  notes?: string;
  status?: string;
  latestRevisionNote?: string;
  revisionHistory?: Array<{ note: string; at: string }>;
  subtotal?: number;
  clientSubtotal?: number;
  total?: number;
  termsTemplate?: string;
  footerNote?: string;
  logos?: string[];
  // optionally a timeline if API provides one
  timeline?: Array<{ phase?: string; description?: string; duration?: string }>;
  packageItems?: Array<{
    id?: string;
    name?: string;
    selected?: boolean;
    qty?: number;
    unitPrice?: number;
  }>;
  complimentaryItems?: Array<{
    id?: string;
    name?: string;
    selected?: boolean;
    qty?: number;
  }>;
  albumsCount?: number;
  albumSheets?: number;
}

interface ApiResponse {
  proposals?: ApiProposalItem[];
}

interface UpdateStatusPayload {
  leadId: string;
  proposalId: string;
  status: string;
  revisionNotes?: string;
}

interface UpdateStatusResponse {
  updated?: {
    status?: string;
    latestRevisionNote?: string;
    revisionHistory?: Array<{ note: string; at: string }>;
  };
  error?: string;
}

function ProposalView() {
  const { id: proposalId } = useParams();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [proposalStatus, setProposalStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Function to get deliverable descriptions based on name and item data
  const getDeliverableDescription = (name: string, item: any): string => {
    // For album-related items, use the actual data from the item or from the package if available
    if (name.toLowerCase().includes('album')) {
      console.log('Album item found:', name);
      console.log('Item data:', item);
      console.log('Proposal data:', proposal);
      console.log('Item albumSheets:', item.albumSheets);
      console.log('Proposal albumSheets:', proposal && (proposal as any).albumSheets);
      
      const albumSheets = item.albumSheets || (proposal && (proposal as any).albumSheets);
      console.log('Final albumSheets value:', albumSheets);
      
      if (albumSheets) {
        return `${name} (${albumSheets} sheets)`;
      }
      // Fallback for album items without sheet data
      return `${name} - Professional album service`;
    }
    
    // For other items, use predefined descriptions
    const descriptions: { [key: string]: string } = {
      'Raw Footage': 'You shall receive a total Raw Footage of all the events',
      'Engagement Promo': 'You shall receive a engagement Promo/Teaser.',
      'Traditional Video': 'You shall receive a Complete Traditional Video with Editing',
      'Cinematic Film': 'You shall receive a cinematic video curated from the best events.',
      'Teaser': 'Teaser for Couple shoot.',
      'Documentary Film': 'You Shall Receive a Documentary Wedding film. Chit Chat with Family.',
      'Edited Images': 'You Shall Receive a edited images from all events.',
      'Live Streaming': 'Live streaming of your special moments',
      'Instagram Reels': 'Instagram Reels for social media sharing',
      'Whatsapp Invitation': 'Whatsapp Invitation for the Wedding',
      'Save The Date Video': 'Save The Date Video',
      'Wedding Full Film': 'You shall Receive a Wedding Full Film (5-8 min).'
    };
    
    return descriptions[name] || 'Professional photography service';
  };

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const resp = await fetch(GET_ALL_URL);
        const data: ApiResponse | ApiProposalItem[] = await resp.json();
        const proposals = Array.isArray(data) ? data : data.proposals || [];
        const matched = proposals.find(
          (item: ApiProposalItem) => item.proposalId?.toString().trim() === proposalId?.toString().trim()
        );
        console.log("**** proposals", proposals);

        if (!matched) {
          console.warn('No matching proposal found for proposalId:', proposalId);
          setProposal(null);
          return;
        }

        const leadIdRaw = matched.leadId || matched.PK || matched.pk || '';
        const leadId = normalizeLeadId(typeof leadIdRaw === 'string' ? leadIdRaw : String(leadIdRaw));

        // Build services array robustly - handle both old and new data structures
        const services: Service[] = (matched.services || []).map((s) => ({
          title: s.title || s.name || 'Service',
          description: s.description || '',
          quantity: Number(s.quantity ?? s.count ?? 0) || 0,
          unitPrice: Number(s.unitPrice ?? 0) || 0,
        }));

        // Build addOns from selected property (if present) or all addOns
        const addOns: AddOn[] = (matched.addOns || [])
          .filter((a) => (typeof a.selected === 'boolean' ? a.selected : true))
          .map((a) => ({ name: a.name || 'Add-on', price: Number(a.price ?? 0) || 0 }));

        // If API provides a timeline, use it. Otherwise, use events data
        let timeline: TimelineItem[] = [];
        if (Array.isArray(matched.timeline) && matched.timeline.length > 0) {
          timeline = matched.timeline.map((t) => ({
            phase: t.phase || '',
            description: t.description || '',
            duration: t.duration || '',
          }));
        } else if (Array.isArray(matched.events) && matched.events.length > 0) {
          // Use actual events data from the proposal
          timeline = matched.events.map((event) => ({
            phase: event.eventTitle || 'Event',
            description: event.description || '',
            duration: event.date ? `${event.date}${event.time ? ` at ${event.time}` : ''}` : '',
            services: event.services || [],
          }));
        }
        // Note: Removed shootType fallback as requested - don't show shoot type in events

        const subtotalFromApi = typeof matched.subtotal === 'number' ? matched.subtotal : undefined;
        // Use clientSubtotal if available (matches Proposals table logic)
        const totalFromApi = typeof matched.clientSubtotal === 'number' ? matched.clientSubtotal :
          (typeof matched.total === 'number' ? matched.total : undefined);

        // Map package items
        const packageItems: PackageItem[] = Array.isArray(matched.packageItems)
          ? matched.packageItems.map((p, idx) => ({
              id: p.id?.toString() || `pkg-${idx}`,
              name: p.name || '',
              selected: !!p.selected,
              qty: Number(p.qty || 1),
              unitPrice: p.unitPrice != null ? Number(p.unitPrice) : undefined,
            }))
          : [];

        // Map complimentary items
        const complimentaryItems: ComplimentaryItem[] = Array.isArray(matched.complimentaryItems)
          ? matched.complimentaryItems.map((c, idx) => ({
              id: c.id?.toString() || `comp-${idx}`,
              name: c.name || '',
              selected: !!c.selected,
              qty: Number(c.qty || 1),
            }))
          : [];

        const mapped: ProposalData = {
          id: matched.proposalId,
          leadId,
          clientName: matched.clientName || '',
          shootType: matched.shootType || '',
          eventDate: matched.eventDate || '',
          venue: matched.venue || '',
          services,
          addOns,
          gstEnabled: !!matched.gstEnabled,
          customNotes: matched.notes || '',
          timeline,
          status: uiStatusFromAPI(matched.status),
          latestRevisionNote: matched.latestRevisionNote,
          revisionHistory: Array.isArray(matched.revisionHistory) ? matched.revisionHistory : undefined,
          subtotal: subtotalFromApi,
          total: totalFromApi,
          termsTemplate: matched.termsTemplate,
          footerNote: matched.footerNote,
          logos: Array.isArray(matched.logos) ? matched.logos : undefined,
          packageItems,
          complimentaryItems,
          albumsCount: typeof matched.albumsCount === 'number' ? matched.albumsCount : (Number(matched.albumsCount) || undefined),
          albumSheets: typeof matched.albumSheets === 'number' ? matched.albumSheets : (Number(matched.albumSheets) || undefined),
        };

        setProposal(mapped);
        setProposalStatus(mapped.status);
      } catch (e) {
        console.error('Failed to fetch proposal:', e);
        setProposal(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProposal();
  }, [proposalId]);

  // If API gave subtotal/total, prefer them. Otherwise compute from services/addOns.
  const calculateSubtotal = () => {
    if (!proposal) return 0;
    if (typeof proposal.subtotal === 'number') return proposal.subtotal;
    const servicesTotal = proposal.services.reduce((total, s) => total + s.quantity * s.unitPrice, 0);
    const addOnsTotal = proposal.addOns.reduce((t, a) => t + a.price, 0);
    return servicesTotal + addOnsTotal;
  };

  const calculateTotal = () => {
    if (!proposal) return 0;
    if (typeof proposal.total === 'number') return proposal.total;
    const subtotal = calculateSubtotal();
    const gstAmount = proposal.gstEnabled ? subtotal * 0.18 : 0;
    return subtotal + gstAmount;
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  async function updateStatus(next: string, extraNotes?: string) {
    if (!proposal) return;
    const payload: UpdateStatusPayload = {
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

      const body: UpdateStatusResponse = await res.json().catch(() => ({} as UpdateStatusResponse));

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
              revisionHistory: Array.isArray(updated?.revisionHistory) ? updated.revisionHistory : p.revisionHistory,
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

        const projectRes = await fetch(
          'https://mk93vwf9k3.execute-api.eu-north-1.amazonaws.com/default/Post_Project_Creation',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectCreationPayload),
          }
        );

        const projectBody: { error?: string } = await projectRes.json().catch(() => ({} as { error?: string }));

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

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="mx-[10%] bg-white rounded-lg shadow-lg p-8">
          <div className="text-gray-600 text-lg">Loading proposal...</div>
        </div>
      </div>
    );

  if (!proposal)
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="mx-[10%] bg-white rounded-lg shadow-lg p-8">
          <div className="text-red-600 text-lg">Proposal not found.</div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section with Blue Gradient Background */}
      <div className="relative h-screen overflow-hidden mx-[10%] bg-white rounded-lg shadow-lg">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src="/images/GAN00196-Edit-Edit.jpg" alt="Romantic Wedding Couple" className="w-full h-full object-cover rounded-lg" />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg"></div>
        </div>

        {/* Logo in bottom left of photo */}
        <div className="absolute bottom-8 left-8 z-10">
          <img src="/logo.jpeg" alt="Arifphotography Logo" className="h-16 w-auto" />
        </div>
      </div>

      {/* Clean Branding Section */}
      <div className="py-16">
        <div className="mx-[10%] bg-white rounded-lg shadow-lg p-8">
          {/* Logo Section */}
          <div className="text-center mb-12">
            <img src="/logo.jpeg" alt="Arifphotography Logo" className="h-20 w-auto mx-auto" />
          </div>

          {/* Thank you message */}
          <div className="text-center mb-8">
            <p className="text-lg text-gray-800 mb-6">Thank you For choosing Us</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-8" style={{ fontFamily: 'serif' }}>
              {proposal.clientName}
            </h2>
          </div>

          {/* Decorative Divider */}
          <div className="flex items-center justify-center mb-12">
            <div className="w-8 h-0.5 bg-gray-400"></div>
            <div className="mx-4">
              <div className="w-6 h-6 border-2 border-gray-400 transform rotate-45"></div>
            </div>
            <div className="w-8 h-0.5 bg-gray-400"></div>
          </div>

          {/* Pricing Section */}
          <div className="text-center mb-12">
            <p className="text-lg text-gray-800 mb-4">Your final quote price would be</p>
            <div className="text-5xl font-bold text-gray-900 mb-8" style={{ fontFamily: 'serif' }}>
              ₹ {calculateTotal().toLocaleString()}
            </div>
          </div>

          {/* Mission Statement */}
          <div className="bg-gray-50 rounded-lg p-8 mb-8">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3">•</span>
                <span>Our passion is capturing precious moments on film for our clients, immortalizing special events and creating keepsakes to treasure forever.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3">•</span>
                <span>Please let us know if you have any queries or require further Clarification. We are happy to discuss any aspects of the quotation in more detail.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3">•</span>
                <span>We Look forward to work with you.....</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="py-12">
        <div className="mx-[10%] bg-white rounded-lg shadow-lg p-8">
          {/* About Us Section */}
          <div className="mb-16">
            <div className="flex items-center justify-center mb-8">
              <div className="w-8 h-0.5 bg-gray-400"></div>
              <div className="mx-4">
                <div className="w-6 h-6 border-2 border-gray-400 transform rotate-45"></div>
              </div>
              <div className="w-8 h-0.5 bg-gray-400"></div>
            </div>

            <h2 className="text-4xl font-bold text-gray-900 mb-6 text-left" style={{ fontFamily: 'serif' }}>
              About Us
            </h2>

            <p className="text-gray-700 text-lg mb-8 leading-relaxed">
              At Arif Photography, we specialize in transforming your wedding into a captivating visual narrative. Our team, led by Arif, is dedicated to providing exceptional wedding photography services that reflect the essence of your unique love story.
            </p>

            {/* Image Gallery - Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Large Main Image - Left Side (2/3 width) */}
              <div className="lg:col-span-2 bg-gray-200 rounded-lg overflow-hidden">
                <img src="/images/GAN00196-Edit-Edit.jpg" alt="Wedding Photography" className="w-full h-full object-cover" />
              </div>

              {/* Right Side Images - Stacked (1/3 width) */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-gray-200 rounded-lg overflow-hidden">
                  <img src="/images/014-A1086-Edit.jpg" alt="Traditional Wedding Ceremony" className="w-full h-auto object-contain" />
                </div>
                <div className="bg-gray-200 rounded-lg overflow-hidden">
                  <img src="/images/014A0588.jpg" alt="Wedding Photography" className="w-full h-auto object-contain" />
                </div>
                <div className="bg-gray-200 rounded-lg overflow-hidden">
                  <img src="/images/089A2368.jpg" alt="Wedding Photography" className="w-full h-auto object-contain" />
                </div>
                <div className="bg-gray-200 rounded-lg overflow-hidden">
                  <img src="/images/IMG-0846.jpg" alt="Wedding Photography" className="w-full h-auto object-contain" />
                </div>
              </div>
            </div>

            {/* Additional Images Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-gray-200 rounded-lg overflow-hidden">
                <img src="/images/IMG-0852.jpg" alt="Wedding Reception" className="w-full h-auto object-contain" />
              </div>
              <div className="bg-gray-200 rounded-lg overflow-hidden">
                <img src="/images/IMG-5741.jpg" alt="Wedding Photography" className="w-full h-auto object-contain" />
              </div>
              <div className="bg-gray-200 rounded-lg overflow-hidden">
                <img src="/images/IMG-9087.jpg" alt="Wedding Photography" className="w-full h-auto object-contain" />
              </div>
            </div>
          </div>

          {/* Your Events Section */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-8 text-left" style={{ fontFamily: 'serif' }}>
              Your Events
            </h2>

            {proposal.timeline && proposal.timeline.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {proposal.timeline.map((event, idx) => (
                  <div key={idx} className="bg-gray-600 text-white p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">
                      {event.phase || `Event ${idx + 1}`}
                    </h3>
                    {event.duration && (
                      <p className="text-sm text-gray-200 mb-2">
                        <span className="font-semibold">Date & Time:</span> {event.duration}
                      </p>
                    )}
                    {proposal.venue && idx === 0 && (
                      <p className="text-sm text-gray-200">
                        <span className="font-semibold">Venue:</span> {proposal.venue}
                      </p>
                    )}
                    {event.services && event.services.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-500">
                        <p className="text-sm font-semibold text-gray-300 mb-2">Services:</p>
                        <div className="space-y-1">
                          {event.services.map((service, sIdx) => (
                            <p key={sIdx} className="text-xs text-gray-300">
                              • {service.name || 'Service'} {service.count && service.count > 1 ? `(x${service.count})` : ''}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <p className="text-gray-600 text-lg">No events information available</p>
                {proposal.eventDate && (
                  <p className="text-gray-500 mt-2">
                    <span className="font-semibold">Event Date:</span> {proposal.eventDate}
                  </p>
                )}
                {proposal.venue && (
                  <p className="text-gray-500">
                    <span className="font-semibold">Venue:</span> {proposal.venue}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Deliverables Section - Package Items */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 text-left" style={{ fontFamily: 'serif' }}>
              Deliverables
            </h2>
            <p className="text-gray-700 text-lg mb-8">As per your request, we propose the following Deliverables as part of this package:</p>

            {/* Package Items */}
            {proposal.packageItems && proposal.packageItems.length > 0 ? (
              <div className="space-y-4 mb-6">
                {proposal.packageItems
                  .filter(item => item.selected)
                  .map((item, i) => (
                    <div key={item.id || i} className="bg-gray-600 text-white p-6 rounded-lg flex items-start justify-between">
                      <div className="flex items-start">
                        <Camera className="h-8 w-8 mr-4 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                          <p className="text-sm text-gray-300 mb-2">{getDeliverableDescription(item.name, item)}</p>
                          {/* {item.qty && item.qty > 0 && (
                            <p className="text-sm text-gray-200">Quantity: {item.qty}</p>
                          )} */}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="bg-gray-100 p-6 rounded-lg text-center mb-6">
                <p className="text-gray-600">No package items specified</p>
              </div>
            )}

            {/* Render selected add-ons dynamically */}
            {proposal.addOns.length > 0 && (
              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-4">Selected Add-Ons</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {proposal.addOns.map((a, i) => (
                    <div key={i} className="bg-gray-600 text-white p-4 rounded-lg flex items-center">
                      <Video className="h-6 w-6 mr-4" />
                      <div>
                        <div className="font-semibold">{a.name}</div>
                        <div className="text-sm">Price: ₹ {a.price.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Album Information Section */}
          {(proposal.albumsCount || proposal.albumSheets) && (
            <div className="mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6 text-left" style={{ fontFamily: 'serif' }}>
                Album Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {proposal.albumsCount && (
                  <div className="bg-gray-600 text-white p-6 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Camera className="h-6 w-6 mr-3" />
                      <h3 className="text-xl font-bold">Album Count</h3>
                    </div>
                    <p className="text-3xl font-semibold mt-2">{proposal.albumsCount}</p>
                    <p className="text-sm text-gray-300 mt-1">Total Albums</p>
                  </div>
                )}
                {proposal.albumSheets && (
                  <div className="bg-gray-600 text-white p-6 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Camera className="h-6 w-6 mr-3" />
                      <h3 className="text-xl font-bold">Album Sheets</h3>
                    </div>
                    <p className="text-3xl font-semibold mt-2">{proposal.albumSheets}</p>
                    <p className="text-sm text-gray-300 mt-1">Total Sheets</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Complimentary Section */}
          {proposal.complimentaryItems && proposal.complimentaryItems.some(item => item.selected) && (
            <div className="mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-8 text-left" style={{ fontFamily: 'serif' }}>
                Complimentary
              </h2>

              <div className="space-y-4">
                {proposal.complimentaryItems
                  .filter(item => item.selected)
                  .map((item, i) => (
                    <div key={item.id || i} className="bg-gray-600 text-white p-6 rounded-lg flex items-start justify-between">
                      <div className="flex items-start">
                        <Video className="h-8 w-8 mr-4 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-xl font-bold">{item.name}</h3>
                          {item.qty > 1 && (
                            <p className="text-sm text-gray-200 mt-1">Quantity: {item.qty}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Payment Schedule Section */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 text-left" style={{ fontFamily: 'serif' }}>
              Payment Schedule
            </h2>
            <p className="text-gray-700 text-lg mb-8">
              Our comprehensive wedding photography package is priced at ₹{calculateTotal().toLocaleString()}, inclusive of all services mentioned above. We propose the following payment schedule:
            </p>

            <div className="space-y-6">
              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Advance Payment</h3>
                <p className="text-gray-700 mb-4">40% of the total billing value to be paid as an advance to block the dates.</p>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Delivery Payment</h3>
                <p className="text-gray-700 mb-4">50% payment before the wedding Day, Remaining 5% at the Delivery Time and final 5% after the Album finalization.</p>
                <div className="space-y-2">
                  <div className="bg-gray-600 text-white p-4 rounded-lg">
                    <span>Before Wedding Day: 50%</span>
                  </div>
                  <div className="bg-gray-600 text-white p-4 rounded-lg">
                    <span>At Delivery Time: 5%</span>
                  </div>
                  <div className="bg-gray-600 text-white p-4 rounded-lg">
                    <span>After Album Finalization: 5%</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <h4 className="text-lg font-bold text-red-800 mb-2">NOTE:</h4>
                <p className="text-red-700">We will strictly deliver the data only after receiving 95% of the total amount.</p>
              </div>

              <div className="bg-gray-800 text-white p-6 rounded-lg">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total Package Price:</span>
                  <span>₹{calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms of Service Section */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 text-left" style={{ fontFamily: 'serif' }}>
              Terms of Service
            </h2>
            <p className="text-gray-700 text-lg mb-8">Our terms of service, including cancellation policies and copyright information, are detailed below for your review.</p>

            <div className="space-y-6">
              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Travel Expense</h3>
                <p className="text-gray-700">You shall arrange for the travel, Food and accommodation of our shoot crew for all your events occurring in places away from our offices.</p>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Project Cancellation</h3>
                <p className="text-gray-700">
                  In the event of cancellation the client is liable to pay the full package cost without eligibility for any discounts or refund. The advance amount for a wedding is non-refundable in the event of cancellation.
                </p>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Event Timings</h3>
                <p className="text-gray-700">Apart from Wedding any event is considered as 4-5 hours for additional coverage need to discuss for adding slot</p>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Data Safety</h3>
                <p className="text-gray-700">For Clients who don't collect deliverables within 60 days, we will not hold responsibility for the Data loss.</p>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Hard Drives</h3>
                <p className="text-gray-700">A Hard Disk must be provided by the clients.(2 Harddisks has to be provided to the Management Team)</p>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Outfits – Best Choices</h3>
                <p className="text-gray-700 mb-2">Clients are advised to prepare 1/2 outfits for the session. (Optional: 3rd outfit based on photography & client requirements.)</p>
                <p className="text-gray-600 text-sm italic">Note: Excessive outfit changes or travel during the shoot may affect the flow and quality of photos. We aim to capture natural, professional moments without interruption.</p>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Shoot Details – Locations</h3>
                <p className="text-gray-700 mb-3">Clients are responsible for securing access to chosen shoot locations. We are not liable for any closures or restrictions at the selected venues.</p>
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold text-gray-900 mb-2">Pre-Wedding Shoot Duration</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Local shoots: 1-day shoot</li>
                    <li>Outstation shoots: 2–3 days (includes travel & shoot time)</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Call Management</h3>
                <p className="text-gray-700">In case we are unable to attend your call during client meetings or internal discussions, please feel free to drop us a message on WhatsApp. Our contact team will get back to you as soon as possible.</p>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Shoot Timings & Waiting Policy</h3>
                <p className="text-gray-700">Clients are requested to arrive at the scheduled shoot time. Waiting time: 15–30 minutes grace period. After 30 minutes, waiting charges will be applicable and added to the final bill.</p>
              </div>
            </div>
          </div>

          {/* Video & Album Corrections Section */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 text-left" style={{ fontFamily: 'serif' }}>
              Additional Terms & Policies
            </h2>
            
            <div className="space-y-6">
              <div className="bg-gray-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Video & Album Corrections</h3>
                <p className="text-gray-700">
                  Clients must request any corrections or changes within 1 week of receiving the final video or album draft. After this period, we will not be responsible for delayed correction requests, and additional charges will apply for any revisions made beyond the 1-week window.
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
                <h3 className="text-xl font-bold text-yellow-800 mb-3">Important Note</h3>
                <p className="text-yellow-700">We will Strictly adhere to providing only the Requirements listed above, without adding or including any additional elements beyond those specified.</p>
              </div>
            </div>

            {/* Decorative Divider */}
            <div className="flex items-center justify-center my-12">
              <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
              <div className="w-8 h-0.5 bg-gray-400 mx-2"></div>
              <div className="w-6 h-6 border-2 border-gray-400 transform rotate-45"></div>
              <div className="w-8 h-0.5 bg-gray-400 mx-2"></div>
              <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
            </div>
          </div>

          {/* Next Steps Section */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 text-left" style={{ fontFamily: 'serif' }}>
              Next Steps
            </h2>
            <div className="space-y-4 text-gray-700 text-lg">
              <p>Please take a moment to review the proposal and attached terms of service. If you have any questions or would like to discuss specific details, feel free to reach out</p>
              <p>We eagerly anticipate the opportunity to contribute to your special day and create a visual story that will be cherished for a lifetime.</p>
            </div>

            <div className="mt-8 text-gray-700">
              <p className="text-lg">Best regards,</p>
              <p className="text-lg font-semibold">Arif Photography</p>
            </div>
          </div>

          {/* Action Buttons */}
          {(['pending', 'revision_requested'] as string[]).includes(proposalStatus) && (
            <div className="py-12">
              <div className="mx-[10%] bg-white rounded-lg shadow-lg p-8">
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <button
                    onClick={handleAccept}
                    disabled={busy}
                    className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                      busy ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {busy ? 'Processing...' : 'Accept Proposal'}
                  </button>

                  <button
                    onClick={() => setShowRevisionModal(true)}
                    disabled={busy}
                    className="px-8 py-3 border-2 border-orange-500 text-orange-500 rounded-lg font-semibold hover:bg-orange-50 transition-colors disabled:opacity-50"
                  >
                    Request Changes
                  </button>

                  <button
                    onClick={handleDecline}
                    disabled={busy}
                    className="px-8 py-3 border-2 border-red-500 text-red-500 rounded-lg font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Revision Request Modal */}
          {showRevisionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Request Changes</h3>
                  <p className="text-gray-600 mb-4">Please describe the changes you'd like to see:</p>

                  <textarea
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Describe the changes you'd like..."
                  />

                  <div className="flex justify-end space-x-3 mt-6">
                    <button onClick={() => setShowRevisionModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handleRevisionRequest}
                      disabled={!revisionNotes.trim() || busy}
                      className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                        revisionNotes.trim() && !busy ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
            <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
              <div className="flex items-center">
                <span className="font-medium">{toastMessage}</span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="py-12">
            <div className="mx-[10%] bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <img src="/logo.jpeg" alt="Arifphotography Logo" className="h-12 w-auto mx-auto mb-4" />
                {proposal.footerNote ? <p className="text-sm text-gray-600">{proposal.footerNote}</p> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProposalView;