// src/pages/ProposalCreate.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  AlertCircle,
  MoreVertical,
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
  services?: ServiceProvided[];
}

interface ServiceProvided {
  id: string;
  name: string;
  count: number;
}

interface ServicePreset {
  id: string;
  name: string;
  items: Omit<ServiceProvided, 'id'>[];
}

interface AddOn {
  id: string;
  name: string;
  price: number;
  selected: boolean;
}

interface PackageItem {
  id: string;
  name: string;
  selected: boolean;
  qty: number;
  /** optional: if you want money math, set per-item price; defaults 0 */
  unitPrice?: number;
}

interface ComplimentaryItem {
  id: string;
  name: string;
  selected: boolean;
  qty: number;
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
  totalPrice: number;        // your “Total Package Price” input
  logo: File | null;
  termsTemplate: string;
  footerNote: string;

  // NEW
  packageItems: PackageItem[];
  complimentaryItems: ComplimentaryItem[];
  // Albums metadata
  albumsCount: number;
  albumSheets: number;
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
    { id: '1', eventTitle: 'Wedding Day', date: '', time: '', description: 'Main wedding ceremony and reception coverage', services: [] }
  ],
  servicesProvided: [],
  addOns: [
    { id: '1', name: 'Drone Photography', price: 15000, selected: false },
    { id: '2', name: 'Teaser Video', price: 25000, selected: false },
    { id: '3', name: 'Highlight Reel', price: 35000, selected: false },
    { id: '4', name: 'Pre-Wedding Shoot', price: 30000, selected: false },
    { id: '5', name: 'Album Design', price: 20000, selected: false }
  ],
  totalPrice: 0,
  logo: null,
  termsTemplate: 'standard',
  footerNote: '',

  // NEW (defaults mirror your screenshots; unitPrice left 0 for now)
  packageItems: [
    { id: 'pkg-raw', name: 'Raw Footage', selected: true, qty: 1, unitPrice: 0 },
    { id: 'pkg-live', name: 'Live Streaming', selected: true, qty: 1, unitPrice: 0 },
    { id: 'pkg-engage-promo', name: 'Engagement Promo', selected: true, qty: 1, unitPrice: 0 },
    { id: 'pkg-trad-video', name: 'Traditional Video', selected: true, qty: 1, unitPrice: 0 },
    { id: 'pkg-cine-teasers', name: 'Cinematic Teasers', selected: true, qty: 1, unitPrice: 0 },
    { id: 'pkg-cine-film', name: 'Cinematic Film', selected: true, qty: 1, unitPrice: 0 },
    { id: 'pkg-teaser', name: 'Teaser', selected: true, qty: 1, unitPrice: 0 },
    { id: 'pkg-doc-film', name: 'Documentary Film', selected: true, qty: 1, unitPrice: 0 },
    { id: 'pkg-edited', name: 'Edited images', selected: true, qty: 1, unitPrice: 0 },
    { id: 'pkg-albums', name: 'Printed Albums', selected: true, qty: 1, unitPrice: 0 },
  ],
  complimentaryItems: [
    { id: 'comp-instagram', name: 'Instagram Reels', selected: true, qty: 1 },
    { id: 'comp-whatsapp', name: 'Whatsapp Invitation for the Wedding', selected: true, qty: 1 },
    { id: 'comp-save-date', name: 'Save The Date Video', selected: true, qty: 1 },
    { id: 'comp-couple-album', name: 'Couple Shoot Album (15-20Sheets)', selected: true, qty: 1 },
  ],
  albumsCount: 0,
  albumSheets: 0,
};

// --- Service Presets (you can expand freely) ---
const SERVICE_PRESETS: ServicePreset[] = [
  {
    id: 'preset-engagement',
    name: 'Engagement',
    items: [
      { name: 'Candid Photography', count: 1 },
      { name: 'Cinematography', count: 1 },
      { name: 'Traditional photography', count: 1 },
      { name: 'Traditional Videography', count: 1 }
    ]
  },
  {
    id: 'preset-prewedding',
    name: 'pre wedding',
    items: [
      { name: 'cinematic', count: 1 },
      { name: 'candid Photography', count: 1 },
      { name: 'Drone', count: 1 }
    ]
  },
  // some examples that match the screenshots:
  {
    id: 'preset-reception',
    name: 'Reception',
    items: [
      { name: 'Candid Photography', count: 1 },
      { name: 'Cinematography', count: 1 },
      { name: 'Traditional photography', count: 1 },
      { name: 'Traditional Videography', count: 1 },
    ]
  },
  {
    id: 'preset-ceremony',
    name: 'Ceremony',
    items: [
      { name: 'Traditional photography', count: 1 },
      { name: 'Traditional Videography', count: 1 },
      { name: 'Candid Photography', count: 1 },
    ]
  },
  {
    id: 'preset-mehendi',
    name: 'Mehendi',
    items: [
      { name: 'candid Photography', count: 1 },
      { name: 'Cinematic', count: 1 },
    ]
  },
  {
    id: 'preset-bride-haldi',
    name: 'Bride Haldi',
    items: [
      { name: 'Candid photography', count: 1 },
      { name: 'Cinematic', count: 1 },
      { name: 'Traditional Photography', count: 1 },
      { name: 'Traditional Videography', count: 1 },
    ]
  },
  {
    id: 'preset-wedding',
    name: 'Wedding',
    items: [
      { name: 'Candid photographer', count: 2 },
      { name: 'Traditional Photographer', count: 2 },
      { name: 'Cinematographer', count: 2 },
      { name: 'Traditional Videographer', count: 2 },
    ]
  },
];

// --- Endpoint constants ---
const GET_LEADS_URL = 'https://sk8wa56suc.execute-api.eu-north-1.amazonaws.com/GetAllLeads';
const GET_PROPOSALS_URL = 'https://av8kc9cjeh.execute-api.eu-north-1.amazonaws.com/GetAllProposalsData';
const POST_PROPOSAL_URL = 'https://cazwal3zzj.execute-api.eu-north-1.amazonaws.com/PostProposalData';
const SENDMAIL_URL = 'https://gqem8o7aw1.execute-api.eu-north-1.amazonaws.com/default/Sendmail';

// --- Extracted Terms Component (unchanged from my last message) ---
const TermsStandard: React.FC = () => (
  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
    <h4 className="font-semibold mb-2">Photography Services Terms:</h4>
    <div className="space-y-3 text-gray-700">
      <div>
        <h5 className="font-semibold">Payment Schedule</h5>
        <p>Our comprehensive wedding photography package is priced at the given price, inclusive of all services mentioned above. We propose the following payment schedule:</p>
        <p><strong>Advance Payment:</strong> 40% of the total billing value to be paid as an advance to block the dates.</p>
        <p><strong>Delivery Payment:</strong> 50% payment before the wedding day, remaining 5% at the delivery time and final 5% after the album finalization.</p>
        <p><em>NOTE: We will strictly deliver the data only after receiving 95% of the total amount.</em></p>
      </div>
      <div>
        <h5 className="font-semibold">Terms of Service</h5>
        <p><strong>Travel Expense:</strong> You shall arrange for the travel, food and accommodation of our shoot crew for all your events away from our offices.</p>
        <p><strong>Project Cancellation:</strong> If canceled, client is liable to pay the full package cost; advance is non-refundable.</p>
        <p><strong>Event Timings:</strong> Apart from wedding, any event is considered 4–5 hours; additional coverage requires adding a slot.</p>
        <p><strong>Data Safety:</strong> Deliverables not collected within 60 days may be lost; we’re not responsible after that window.</p>
        <p><strong>Hard Drives:</strong> Provide 2 hard disks to the management team.</p>
      </div>
      <div>
        <h5 className="font-semibold">Outfits – Best Choices</h5>
        <p>Prepare 1–2 outfits (optional 3rd). <em>Excessive changes/travel can affect flow and quality.</em></p>
      </div>
      <div>
        <h5 className="font-semibold">Shoot Details – Locations</h5>
        <p>Client secures access to locations.</p>
        <p><strong>Pre-Wedding Duration:</strong> Local: 1 day. Outstation: 2–3 days (travel + shoot).</p>
      </div>
      <div>
        <h5 className="font-semibold">Call Management</h5>
        <p>If we miss your call during meetings, please WhatsApp us; we’ll get back ASAP.</p>
      </div>
      <div>
        <h5 className="font-semibold">Shoot Timings &amp; Waiting Policy</h5>
        <p>Arrive on time. 15–30 min grace; after 30 min, waiting charges apply.</p>
      </div>
      <div>
        <h5 className="font-semibold">Video &amp; Album Corrections</h5>
        <p>Request corrections within 1 week of receiving the draft; later changes may incur charges.</p>
      </div>
      <div>
        <p><em><strong>Note:</strong> We will strictly adhere to the listed requirements only.</em></p>
      </div>
    </div>
  </div>
);

// --- Helpers to render preset summary line (like your screenshots)
const presetSummary = (preset: ServicePreset) =>
  preset.items.map(it => `${it.count} ${it.name}`).join(' ');

function ProposalCreate() {
  const { leadId, proposalId } = useParams<{ leadId?: string; proposalId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [proposalData, setProposalData] = useState<ProposalData>({ ...emptyProposalTemplate });

  // --- Fetch initial data (proposalId or leadId) --- (unchanged except we keep packageItems defaults)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const initEmpty = () => {
        setProposalData({ ...emptyProposalTemplate });
        setLogoPreview(null);
      };

      // Check if we're in edit mode with data from URL
      const isEditMode = searchParams.get('edit') === 'true';
      const editDataParam = searchParams.get('data');
      
      if (isEditMode && editDataParam) {
        try {
          const editData = JSON.parse(decodeURIComponent(editDataParam));
          console.log('Edit data received:', editData);
          
          // Pre-fill the form with edit data
          setProposalData(prev => ({
            ...prev,
            clientName: editData.clientName || prev.clientName,
            recipientEmail: editData.clientEmail || prev.recipientEmail,
            shootType: editData.shootType || prev.shootType,
            eventDate: editData.eventDate || prev.eventDate,
            totalPrice: editData.totalAmount || prev.totalPrice,
            notes: editData.notes || prev.notes,
            // Map services and addOns if they exist
            servicesProvided: editData.services ? editData.services.map((s: any, idx: number) => ({
              id: `svc-${idx}`,
              name: s.name || '',
              count: 1
            })) : prev.servicesProvided,
            addOns: editData.addOns ? editData.addOns.map((a: any, idx: number) => ({
              id: `addon-${idx}`,
              name: a.name || '',
              price: a.price || 0,
              selected: true
            })) : prev.addOns,
            // NEW: albums meta
            albumsCount: typeof editData.albumsCount === 'number' ? editData.albumsCount : (Number(editData.albumsCount) || prev.albumsCount),
            albumSheets: typeof editData.albumSheets === 'number' ? editData.albumSheets : (Number(editData.albumSheets) || prev.albumSheets),
            // NEW: events mapping
            events: Array.isArray(editData.events) && editData.events.length ? editData.events.map((e: any, idx: number) => ({
              id: e.id?.toString?.() || `evt-${idx}`,
              eventTitle: e.eventTitle || e.title || '',
              date: e.date || '',
              time: e.time || '',
              description: e.description || '',
              services: Array.isArray(e.services)
                ? e.services.map((s: any, sIdx: number) => ({
                    id: s.id?.toString?.() || `svc-${idx}-${sIdx}`,
                    name: s.name || '',
                    count: Number(s.count || 1)
                  }))
                : []
            })) : prev.events,
            // NEW: packages mapping
            packageItems: Array.isArray(editData.packageItems) ? editData.packageItems.map((p: any, idx: number) => ({
              id: p.id?.toString?.() || `pkg-${idx}`,
              name: p.name || '',
              selected: !!p.selected,
              qty: Number(p.qty || 1),
              unitPrice: p.unitPrice != null ? Number(p.unitPrice) : undefined,
            })) : prev.packageItems,
            complimentaryItems: Array.isArray(editData.complimentaryItems) ? editData.complimentaryItems.map((c: any, idx: number) => ({
              id: c.id?.toString?.() || `comp-${idx}`,
              name: c.name || '',
              selected: !!c.selected,
              qty: Number(c.qty || 1),
            })) : prev.complimentaryItems,
          }));
          
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error parsing edit data:', error);
          // Fall through to normal initialization
        }
      }

      try {
        if (proposalId) {
          const res = await fetch(GET_PROPOSALS_URL);
          if (!res.ok) { initEmpty(); setLoading(false); return; }
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
                  description: e.description || '',
                  services: Array.isArray(e.services)
                    ? e.services.map((s: any, sIdx: number) => ({
                        id: s.id?.toString?.() || `svc-${idx}-${sIdx}`,
                        name: s.name || '',
                        count: Number(s.count || 1)
                      }))
                    : []
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

            setProposalData(prev => ({
              ...prev,
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
              footerNote: matched.footerNote || matched.footer || '',
              // keep default packageItems if backend has none
              packageItems: Array.isArray(matched.packageItems) ? matched.packageItems : prev.packageItems,
              complimentaryItems: Array.isArray(matched.complimentaryItems) ? matched.complimentaryItems : prev.complimentaryItems,
              albumsCount: Number(matched.albumsCount || 0),
              albumSheets: Number(matched.albumSheets || 0),
            }));

            const candidate = matched.logoUrl || matched.logo || (matched.logos && matched.logos[0]);
            if (typeof candidate === 'string') setLogoPreview(candidate);

            setLoading(false);
            return;
          }
        }

        if (leadId) {
          try {
            const response = await fetch(GET_LEADS_URL);
            if (!response.ok) { initEmpty(); setLoading(false); return; }
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
                initEmpty(); setLoading(false); return;
              }
            } else {
              initEmpty(); setLoading(false); return;
            }
          } catch {
            initEmpty(); setLoading(false); return;
          }
        }

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

  const addEventService = (eventId: string) => {
    setProposalData(prev => ({
      ...prev,
      events: prev.events.map(ev =>
        ev.id === eventId
          ? {
              ...ev,
              services: [
                ...(ev.services || []),
                { id: `${Date.now()}`, name: '', count: 1 }
              ]
            }
          : ev
      )
    }));
  };

  const removeEventService = (eventId: string, serviceId: string) => {
    setProposalData(prev => ({
      ...prev,
      events: prev.events.map(ev =>
        ev.id === eventId
          ? { ...ev, services: (ev.services || []).filter(s => s.id !== serviceId) }
          : ev
      )
    }));
  };

  const handleEventServiceChange = (
    eventId: string,
    serviceId: string,
    field: keyof ServiceProvided,
    value: any
  ) => {
    setProposalData(prev => ({
      ...prev,
      events: prev.events.map(ev =>
        ev.id === eventId
          ? {
              ...ev,
              services: (ev.services || []).map(s =>
                s.id === serviceId ? { ...s, [field]: value } : s
              )
            }
          : ev
      )
    }));
  };

  const applyPresetToEvent = (eventId: string, presetId: string) => {
    const preset = SERVICE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setProposalData(prev => ({
      ...prev,
      events: prev.events.map(ev =>
        ev.id === eventId
          ? {
              ...ev,
              services: preset.items.map((item, idx) => ({
                id: `${Date.now()}-${idx}`,
                name: item.name,
                count: item.count
              }))
            }
          : ev
      )
    }));
  };

  const addEvent = () => {
    const newEvent: Event = {
      id: Date.now().toString(),
      eventTitle: '',
      date: '',
      time: '',
      description: '',
      services: []
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

  // --- Package Amount handlers
  const togglePackageItem = (id: string) => {
    setProposalData(prev => ({
      ...prev,
      packageItems: prev.packageItems.map(i => i.id === id ? { ...i, selected: !i.selected } : i)
    }));
  };
  const changePkgQty = (id: string, qty: number) => {
    setProposalData(prev => ({
      ...prev,
      packageItems: prev.packageItems.map(i => i.id === id ? { ...i, qty: Math.max(1, qty) } : i)
    }));
  };

  // --- Complimentary handlers
  const toggleComplimentaryItem = (id: string) => {
    setProposalData(prev => ({
      ...prev,
      complimentaryItems: prev.complimentaryItems.map(i => i.id === id ? { ...i, selected: !i.selected } : i)
    }));
  };
  const changeComplimentaryQty = (id: string, qty: number) => {
    setProposalData(prev => ({
      ...prev,
      complimentaryItems: prev.complimentaryItems.map(i => i.id === id ? { ...i, qty: Math.max(1, qty) } : i)
    }));
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

  const calculatePackageSubtotal = () =>
    proposalData.packageItems
      .filter(i => i.selected)
      .reduce((sum, i) => sum + (i.qty || 0) * (i.unitPrice || 0), 0);

  const calculateSubtotal = () => {
    const addOnsTotal = proposalData.addOns.filter(a => a.selected).reduce((t, a) => t + a.price, 0);
    const pkgSub = calculatePackageSubtotal();
    return (proposalData.totalPrice || 0) + addOnsTotal + pkgSub; // includes Package Amount
  };

  const calculateTotal = () => calculateSubtotal();

  const nextStep = () => { if (currentStep < 4) setCurrentStep(prev => prev + 1); };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(prev => prev - 1); };

  // --- handleSendProposal ---
  const handleSendProposal = async () => {
    const recipient = (proposalData.recipientEmail || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Recipient email is now optional - removed validation requirements

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
        services: proposalData.events.flatMap(e => e.services || []),
        servicesProvided: undefined,
        packageSubtotal: calculatePackageSubtotal(),
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

      // Only send email if recipient email is provided and valid
      if (recipient && emailRegex.test(recipient)) {
        const emailPayload = {
          to: recipient,
          subject: `Proposal from ${proposalData.clientName || 'Client'} — #${newProposalId}`,
          proposalId: newProposalId,
          clientName: proposalData.clientName,
          events: proposalData.events,
          services: proposalData.events.flatMap(e => e.services || []),
          addOns: proposalData.addOns,
          packageItems: proposalData.packageItems,
          packageSubtotal: calculatePackageSubtotal(),
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
        try { sendResult = await sendResponse.json(); } catch {}

        if (!sendResponse.ok || !sendResult.success) {
          alert(`Proposal was created (ID: ${newProposalId}), but sending the email failed. Please send the link manually: ${proposalLink}`);
        } else {
          alert('Proposal saved and email sent successfully!');
        }
      } else {
        // No recipient email provided - just save the proposal
        alert(`Proposal saved successfully! (ID: ${newProposalId}) You can share this link manually: ${proposalLink}`);
      }

      navigate(`/proposals/view/${newProposalId}`);
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

  // UI
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header 
          title={searchParams.get('edit') === 'true' ? "Edit Proposal" : "Create Proposal"} 
          sidebarCollapsed={sidebarCollapsed} 
        />

        <main className="pt-16 p-6">
          <button
            onClick={() => navigate(`/proposals`)}
            className="flex items-center text-[#00BCEB] hover:text-[#00A5CF] mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to proposals
          </button>

          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h1 className="text-2xl font-bold text-[#2D2D2D] mb-4">Create New Proposal</h1>
              <div className="flex items-center space-x-4">
                {[1,2,3].map((num) => {
                  const step = [
                    { number: 1, title: 'Basic Info' },
                    { number: 2, title: 'Events & Services' },
                    { number: 3, title: 'Terms & Branding' }
                  ].find(s => s.number === num)!;
                  return (
                    <div key={step.number} className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${currentStep === step.number ? 'bg-[#00BCEB] text-white' : currentStep > step.number ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {currentStep > step.number ? <Check className="h-4 w-4" /> : step.number}
                      </div>
                      <span className={`ml-2 text-sm font-medium ${currentStep >= step.number ? 'text-[#2D2D2D]' : 'text-gray-500'}`}>{step.title}</span>
                      {step.number < 3 && <div className={`w-12 h-0.5 mx-4 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}`} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
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
                          <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Albums Count</label>
                          <input
                            type="number"
                            min={0}
                            value={proposalData.albumsCount}
                            onChange={(e)=> handleInputChange('albumsCount', Math.max(0, Number(e.target.value) || 0))}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[#2D2D2D]"
                            placeholder="Albums Count"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Album Sheets</label>
                          <input
                            type="number"
                            min={0}
                            value={proposalData.albumSheets}
                            onChange={(e)=> handleInputChange('albumSheets', Math.max(0, Number(e.target.value) || 0))}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[#2D2D2D]"
                            placeholder="Album Sheets"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Event Date</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="h-4 w-4 text-gray-400" /></div>
                            <input type="date" value={proposalData.eventDate} onChange={(e)=> handleInputChange('eventDate', e.target.value)} className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg"/>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Recipient Email (Optional)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Send className="h-4 w-4 text-gray-400" /></div>
                            <input type="email" value={proposalData.recipientEmail} onChange={(e)=> handleInputChange('recipientEmail', e.target.value)} className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-[#2D2D2D]" placeholder="recipient@example.com (optional)"/>
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
                    <div className="space-y-8">
                      <h2 className="text-xl font-semibold text-[#2D2D2D]">Event & Services Details</h2>

        
                      {/* Events CRUD (unchanged) */}
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

                            {/* Services for this Event */}
                            <div className="pt-2">
                              <div className="flex items-center justify-between">
                                <div className="text-sm text-[#2D2D2D] font-medium">Services Provided <span className="mx-1 text-gray-400">|</span> </div>
                                <select onChange={(e)=> { if (e.target.value) { applyPresetToEvent(event.id, e.target.value); e.target.value=''; } }} className="text-sm bg-white border border-gray-200 rounded px-2 py-1" defaultValue="">
                                  <option value="">Choose preset</option>
                                  {SERVICE_PRESETS.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                </select>
                              </div>

                              {(event.services || []).map((svc) => (
                                <div key={svc.id} className="flex items-center justify-between mt-2">
                                  <input
                                    type="text"
                                    value={svc.name}
                                    onChange={(e)=> handleEventServiceChange(event.id, svc.id, 'name', e.target.value)}
                                    className="flex-1 mr-3 px-3 py-2 bg-white border border-gray-200 rounded-lg"
                                    placeholder="Service name"
                                  />
                                  <div className="flex items-center space-x-2">
                                    <button onClick={()=> handleEventServiceChange(event.id, svc.id, 'count', Math.max(1, (svc.count||1)-1))} className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 rounded hover:bg-gray-300">-</button>
                                    <input type="number" min={1} value={svc.count} onChange={(e)=> handleEventServiceChange(event.id, svc.id, 'count', Number(e.target.value)||1)} className="w-16 text-center px-2 py-2 bg-white border border-gray-200 rounded" />
                                    <button onClick={()=> handleEventServiceChange(event.id, svc.id, 'count', (svc.count||1)+1)} className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 rounded hover:bg-gray-300">+</button>
                                    <button onClick={()=> removeEventService(event.id, svc.id)} className="ml-2 text-red-500 hover:text-red-700"><X className="h-4 w-4"/></button>
                                  </div>
                                </div>
                              ))}

                              <button onClick={()=> addEventService(event.id)} className="mt-3 text-[#00BCEB] hover:text-[#00A5CF] text-sm font-medium">+ Add Role</button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Package Amount */}
                      <div className="rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                          <div>
                            <h3 className="font-semibold text-[#2D2D2D]">Package Amount</h3>
                            <p className="text-xs text-gray-500">Services - Client can only view these fixed package services.</p>
                          </div>
                          <div className="text-sm">
                            Selected Subtotal : <span className="font-semibold">₹{calculatePackageSubtotal().toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          {proposalData.packageItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between border-b last:border-b-0 py-3">
                              {/* Checkbox + Service Name */}
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={item.selected}
                                  onChange={() => togglePackageItem(item.id)}
                                  className="h-4 w-4"
                                />
                                <span className="text-[#2D2D2D]">{item.name}</span>
                              </div>

                              {/* Quantity Adjustment Buttons */}
                              <div className="flex items-center justify-center">
                                <div className="flex items-center justify-between bg-gray-100 rounded-md">
                                  <button
                                    onClick={() => changePkgQty(item.id, (item.qty || 1) - 1)}
                                    className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-l-md"
                                  >-</button>
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.qty}
                                    onChange={(e) => changePkgQty(item.id, Number(e.target.value) || 1)}
                                    className="w-12 text-center bg-white border-x border-gray-200 h-10"
                                  />
                                  <button
                                    onClick={() => changePkgQty(item.id, (item.qty || 1) + 1)}
                                    className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-r-md"
                                  >+</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Complimentary Section */}
                      <div className="rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                          <div>
                            <h3 className="font-semibold text-[#2D2D2D]">Complimentary</h3>
                            <p className="text-xs text-gray-500">Additional complimentary services included in the package.</p>
                          </div>
                          <div className="text-sm">
                            Selected Subtotal : <span className="font-semibold">₹0</span>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          {proposalData.complimentaryItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between border-b last:border-b-0 py-3">
                              {/* Checkbox + Service Name */}
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={item.selected}
                                  onChange={() => toggleComplimentaryItem(item.id)}
                                  className="h-4 w-4"
                                />
                                <span className="text-[#2D2D2D]">{item.name}</span>
                              </div>

                              {/* Quantity Adjustment Buttons */}
                              <div className="flex items-center justify-center">
                                <div className="flex items-center justify-between bg-gray-100 rounded-md">
                                  <button
                                    onClick={() => changeComplimentaryQty(item.id, (item.qty || 1) - 1)}
                                    className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-l-md"
                                  >-</button>
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.qty}
                                    onChange={(e) => changeComplimentaryQty(item.id, Number(e.target.value) || 1)}
                                    className="w-12 text-center bg-white border-x border-gray-200 h-10"
                                  />
                                  <button
                                    onClick={() => changeComplimentaryQty(item.id, (item.qty || 1) + 1)}
                                    className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-r-md"
                                  >+</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Base "Total Package Price" input (still here) */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium text-[#2D2D2D]">Total Package Price</h3>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><DollarSign className="h-4 w-4 text-gray-400" /></div>
                          <input
                            type="number"
                            min={0}
                            value={proposalData.totalPrice}
                            onChange={(e) => handleInputChange('totalPrice', Number(e.target.value) || 0)}
                            className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg"
                            placeholder="Enter total package price"
                          />
                        </div>
                        <p className="text-xs text-gray-500">Grand Total = Total Package Price + Package Amount + Add-ons</p>
                      </div>

                      {/* Optional Add-ons (unchanged) */}
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

                      {/* Running total */}
                      <div className="bg-[#00BCEB]/5 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-[#2D2D2D]"><span>Package Amount:</span><span>₹{calculatePackageSubtotal().toLocaleString()}</span></div>
                        <div className="flex justify-between text-[#2D2D2D]"><span>Add-ons:</span><span>₹{proposalData.addOns.filter(a => a.selected).reduce((t, a) => t + a.price, 0).toLocaleString()}</span></div>
                        <div className="flex justify-between text-[#2D2D2D]"><span>Total Package Price:</span><span>₹{proposalData.totalPrice.toLocaleString()}</span></div>
                        <div className="flex justify-between text-lg font-semibold text-[#2D2D2D] pt-2 border-t border-[#00BCEB]/20"><span>Grand Total:</span><span>₹{calculateTotal().toLocaleString()}</span></div>
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

                        {proposalData.termsTemplate === 'standard' && (<TermsStandard />)}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Footer Note (Optional)</label>
                        <textarea value={proposalData.footerNote} onChange={(e) => handleInputChange('footerNote', e.target.value)} rows={4} className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg" placeholder="Add any personalized message or condition..."/>
                      </div>
                    </div>
                  )}

                  {/* NAV */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <button onClick={prevStep} disabled={currentStep === 1} className={`flex items-center px-4 py-2 rounded-lg font-medium ${currentStep === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-[#2D2D2D] hover:bg-gray-200'}`}><ArrowLeft className="h-4 w-4 mr-2" />Previous</button>
                    {currentStep < 3 ? (
                      <button onClick={nextStep} disabled={!isStepValid(currentStep)} className={`flex items-center px-6 py-2 rounded-lg font-medium ${isStepValid(currentStep) ? 'bg-[#00BCEB] text-white hover:bg-[#00A5CF] shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>Next<ArrowRight className="h-4 w-4 ml-2" /></button>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <button onClick={() => setCurrentStep(2)} className="px-4 py-2 bg-gray-100 text-[#2D2D2D] rounded-lg">Go Back</button>
                        <button
                          onClick={handleSendProposal}
                          disabled={isSubmitting}
                          title="Send Proposal"
                          className={`flex items-center px-6 py-2 rounded-lg font-medium ${!isSubmitting ? 'bg-[#00BCEB] text-white hover:bg-[#00A5CF] shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                        >
                          {isSubmitting ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Sending...</>) : (<><Send className="h-4 w-4 mr-2" />Send Proposal</>)}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column: Live Preview */}
                <div className="hidden lg:block">
                  <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4">Live Preview</h2>
                  <div className="bg-gray-50 rounded-lg p-6 min-h-[600px]">
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
                        <p className="text-[#2D2D2D]">{proposalData.clientName || 'Client Name'}</p>
                        <p className="text-gray-600">{proposalData.shootType || 'Shoot Type'}</p>
                        <p className="text-gray-600">{proposalData.eventDate ? new Date(proposalData.eventDate).toLocaleDateString() : 'Event Date'}</p>
                        {proposalData.venue && <p className="text-gray-600">{proposalData.venue}</p>}
                        {(proposalData.albumsCount > 0 || proposalData.albumSheets > 0) && (
                          <div className="mt-2 text-sm text-gray-700">
                            {proposalData.albumsCount > 0 && <p>Albums Count: <span className="font-medium text-[#2D2D2D]">{proposalData.albumsCount}</span></p>}
                            {proposalData.albumSheets > 0 && <p>Album Sheets: <span className="font-medium text-[#2D2D2D]">{proposalData.albumSheets}</span></p>}
                          </div>
                        )}
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Events</h3>
                        <div className="space-y-3">
                          {proposalData.events.map((event) => (
                            <div key={event.id} className="border-l-4 border-[#00BCEB] pl-4">
                              <p className="font-medium text-[#2D2D2D]">{event.eventTitle || 'Event Title'}</p>
                              <p className="text-sm text-gray-600">{event.description}</p>
                              {event.date && <p className="text-sm text-gray-600">Date: {new Date(event.date).toLocaleDateString()}</p>}
                              {event.time && <p className="text-sm text-gray-600">Time: {event.time}</p>}
                              {event.services && event.services.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-500 mb-1">Services:</p>
                                  <div className="space-y-1">
                                    {event.services.map((service, idx) => (
                                      <p key={idx} className="text-xs text-gray-600">• {service.name} (x{service.count})</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Package Amount Section */}
                      {proposalData.packageItems.some(item => item.selected) && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Package Services</h3>
                          <div className="space-y-2">
                            {proposalData.packageItems.filter(item => item.selected).map((item) => (
                              <div key={item.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                                <span className="text-[#2D2D2D]">{item.name}</span>
                                <div className="flex items-center space-x-2">
                                  {item.unitPrice && item.unitPrice > 0 && (
                                    <span className="text-sm text-gray-600">₹{item.unitPrice.toLocaleString()}/unit</span>
                                  )}
                                  <span className="text-sm font-medium text-[#2D2D2D]">Qty: {item.qty}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Complimentary Section */}
                      {proposalData.complimentaryItems.some(item => item.selected) && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Complimentary Services</h3>
                          <div className="space-y-2">
                            {proposalData.complimentaryItems.filter(item => item.selected).map((item) => (
                              <div key={item.id} className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded border border-blue-200">
                                <span className="text-[#2D2D2D]">{item.name}</span>
                                <span className="text-sm font-medium text-[#2D2D2D]">Qty: {item.qty}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Services Provided</h3>
                        <div className="space-y-2">
                          {proposalData.servicesProvided.length > 0 ? (
                            proposalData.servicesProvided.map((service) => (
                              <div key={service.id} className="flex justify-between py-2 px-3 bg-gray-50 rounded">
                                <p className="text-[#2D2D2D]">{service.name}</p>
                                <p className="text-sm text-gray-600">Count: {service.count}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 italic">No additional services added</p>
                          )}
                        </div>
                      </div>

                      {proposalData.addOns.some(a => a.selected) && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Add-ons</h3>
                          <div className="space-y-2">
                            {proposalData.addOns.filter(a => a.selected).map((a) => (
                              <div key={a.id} className="flex justify-between py-2 px-3 bg-[#00BCEB]/5 rounded border border-[#00BCEB]/20">
                                <p className="text-[#2D2D2D]">{a.name}</p>
                                <p className="font-medium text-[#2D2D2D]">₹{a.price.toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-[#2D2D2D]">Package Amount:</span>
                            <span className="text-[#2D2D2D]">₹{calculatePackageSubtotal().toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#2D2D2D]">Add-ons:</span>
                            <span className="text-[#2D2D2D]">₹{proposalData.addOns.filter(a => a.selected).reduce((t, a) => t + a.price, 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#2D2D2D]">Total Package Price:</span>
                            <span className="text-[#2D2D2D]">₹{proposalData.totalPrice.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xl font-bold text-[#2D2D2D] pt-2 border-t">
                            <span>Grand Total:</span>
                            <span className="text-[#00BCEB]">₹{calculateTotal().toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {proposalData.footerNote && (
                        <div className="mt-6 pt-4 border-t">
                          <h4 className="text-sm font-medium text-[#2D2D2D] mb-2">Additional Notes:</h4>
                          <p className="text-sm text-gray-600">{proposalData.footerNote}</p>
                        </div>
                      )}

                      {proposalData.termsTemplate && (
                        <div className="mt-6 pt-4 border-t">
                          <h4 className="text-sm font-medium text-[#2D2D2D] mb-2">Terms & Conditions:</h4>
                          <p className="text-xs text-gray-600">Standard photography terms and conditions apply</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ProposalCreate;
