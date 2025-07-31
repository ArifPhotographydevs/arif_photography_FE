import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  X, 
  Upload, 
  FileText, 
  Eye, 
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
interface Service {
  id: string;
  title: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
  selected: boolean;
}

interface ProposalData {
  clientName: string;
  shootType: string;
  eventDate: string;
  venue: string;
  notes: string;
  services: Service[];
  addOns: AddOn[];
  gstEnabled: boolean;
  logo: File | null;
  termsTemplate: string;
  footerNote: string;
}

// --- MAIN COMPONENT ---
function ProposalCreate() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // State for loading, error, and API submission
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize state with empty/default values from the original UI
  const [proposalData, setProposalData] = useState<ProposalData>({
    clientName: '', 
    shootType: '',
    eventDate: '',
    venue: '',
    notes: '',
    services: [
      { id: '1', title: 'Wedding Photography', description: 'Full day wedding coverage', quantity: 1, unitPrice: 50000 }
    ],
    addOns: [
      { id: '1', name: 'Drone Photography', price: 15000, selected: false },
      { id: '2', name: 'Teaser Video', price: 25000, selected: false },
      { id: '3', name: 'Highlight Reel', price: 35000, selected: false },
      { id: '4', name: 'Pre-Wedding Shoot', price: 30000, selected: false },
      { id: '5', name: 'Album Design', price: 20000, selected: false }
    ],
    gstEnabled: false,
    logo: null,
    termsTemplate: '',
    footerNote: ''
  });

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchLeadData = async () => {
      if (!leadId) {
        setError("No Lead ID was provided in the URL.");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('https://sk8wa56suc.execute-api.eu-north-1.amazonaws.com/GetAllLeads');
        if (!response.ok) {
          throw new Error('Failed to connect to the server. Please try again later.');
        }
        const data = await response.json();

        if (data.success && Array.isArray(data.leads)) {
          const matchedLead = data.leads.find((l: any) => l.leadId === leadId);

          if (matchedLead) {
            const primaryEvent = matchedLead.eventDetails?.[0];
            const clientName = `${matchedLead.personalInfo.brideName} & ${matchedLead.personalInfo.groomName}`;
            const shootType = matchedLead.selectedEvents.join(', ');
            const eventDate = primaryEvent?.date ? new Date(primaryEvent.date).toISOString().split('T')[0] : '';

            setProposalData(prevData => ({
              ...prevData,
              clientName,
              shootType,
              eventDate,
            }));
          } else {
            setError(`The lead with ID "${leadId}" could not be found.`);
          }
        } else {
          setError('Invalid data format was received from the server.');
        }
      } catch (err: any) {
        console.error('Error fetching lead for proposal:', err);
        setError(err.message || 'An unexpected error occurred while fetching lead details.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeadData();
  }, [leadId]);

  // --- WIZARD AND FORM CONFIG ---
  const steps = [
    { number: 1, title: 'Basic Info', completed: false },
    { number: 2, title: 'Package Builder', completed: false },
    { number: 3, title: 'Terms & Branding', completed: false },
    { number: 4, title: 'Preview & Send', completed: false }
  ];

  const termsTemplates = [
    { value: 'standard', label: 'Standard Wedding Terms' },
    { value: 'premium', label: 'Premium Package Terms' },
    { value: 'corporate', label: 'Corporate Event Terms' },
    { value: 'custom', label: 'Custom Terms' }
  ];

  // --- HANDLER FUNCTIONS ---
  const handleInputChange = (field: keyof ProposalData, value: any) => {
    setProposalData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceChange = (serviceId: string, field: keyof Service, value: any) => {
    setProposalData(prev => ({
      ...prev,
      services: prev.services.map(service =>
        service.id === serviceId ? { ...service, [field]: value } : service
      )
    }));
  };

  const addService = () => {
    const newService: Service = {
      id: Date.now().toString(),
      title: '',
      description: '',
      quantity: 1,
      unitPrice: 0
    };
    setProposalData(prev => ({ ...prev, services: [...prev.services, newService] }));
  };

  const removeService = (serviceId: string) => {
    setProposalData(prev => ({
      ...prev,
      services: prev.services.filter(service => service.id !== serviceId)
    }));
  };

  const toggleAddOn = (addOnId: string) => {
    setProposalData(prev => ({
      ...prev,
      addOns: prev.addOns.map(addOn =>
        addOn.id === addOnId ? { ...addOn, selected: !addOn.selected } : addOn
      )
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

  const calculateSubtotal = () => {
    const servicesTotal = proposalData.services.reduce((total, service) => total + (service.quantity * service.unitPrice), 0);
    const addOnsTotal = proposalData.addOns.filter(addOn => addOn.selected).reduce((total, addOn) => total + addOn.price, 0);
    return servicesTotal;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const gstAmount = proposalData.gstEnabled ? subtotal * 0.18 : 0;
    return subtotal + gstAmount;
  };

  const nextStep = () => currentStep < 4 && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  const handleSendProposal = async () => {
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
        logo: undefined, // Remove file object
        logos: base64Logo ? [base64Logo] : [],
        subtotal: calculateSubtotal(),
        total: calculateTotal()
      };

      const response = await fetch('https://cazwal3zzj.execute-api.eu-north-1.amazonaws.com/PostProposalData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to send proposal.');
      
      alert('Proposal sent successfully!');
      navigate(`/leads/${leadId}`);

    } catch (error: any) {
      console.error('Error sending proposal:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1: return true;
      case 2: return proposalData.services.every(s => s.title && s.unitPrice > 0);
      case 3: return proposalData.termsTemplate !== '';
      default: return true;
    }
  };

  // --- RENDER LOGIC ---
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Clock className="h-8 w-8 animate-spin text-[#00BCEB]" />
        <p className="ml-4 text-xl text-gray-700">Loading Lead Data...</p>
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
            onClick={() => navigate(`/leads/${leadId}`)}
            className="flex items-center text-[#00BCEB] hover:text-[#00A5CF] mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </button>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h1 className="text-2xl font-bold text-[#2D2D2D] mb-4">Create New Proposal</h1>
              <div className="flex items-center space-x-4">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${currentStep === step.number ? 'bg-[#00BCEB] text-white' : currentStep > step.number ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {currentStep > step.number ? <Check className="h-4 w-4" /> : step.number}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${currentStep >= step.number ? 'text-[#2D2D2D]' : 'text-gray-500'}`}>{step.title}</span>
                    {index < steps.length - 1 && <div className={`w-12 h-0.5 mx-4 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}`} />}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {/* --- STEP 1: Basic Info --- */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Client Name</label>
                      <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-gray-400" /></div><input type="text" value={proposalData.clientName} readOnly className="w-full pl-10 pr-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-[#2D2D2D] cursor-not-allowed"/></div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Shoot Type</label>
                      <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Camera className="h-4 w-4 text-gray-400" /></div><input type="text" value={proposalData.shootType} readOnly className="w-full pl-10 pr-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-[#2D2D2D] cursor-not-allowed"/></div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Event Date</label>
                      <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="h-4 w-4 text-gray-400" /></div><input type="date" value={proposalData.eventDate} readOnly className="w-full pl-10 pr-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-[#2D2D2D] cursor-not-allowed"/></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Venue (Optional)</label>
                      <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPin className="h-4 w-4 text-gray-400" /></div><input type="text" value={proposalData.venue} onChange={(e) => handleInputChange('venue', e.target.value)} className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200" placeholder="Enter venue location"/></div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Notes (Optional)</label>
                      <textarea value={proposalData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} rows={3} className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200 resize-none" placeholder="Add any special notes or requirements"/>
                    </div>
                  </div>
                </div>
              )}

              {/* --- STEP 2: Package Builder --- */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4">Build Your Package</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between"><h3 className="text-lg font-medium text-[#2D2D2D]">Services</h3><button onClick={addService} className="flex items-center px-3 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200"><Plus className="h-4 w-4 mr-2" />Add Service</button></div>
                    {proposalData.services.map((service, index) => (
                      <div key={service.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between"><h4 className="font-medium text-[#2D2D2D]">Service {index + 1}</h4>{proposalData.services.length > 1 && <button onClick={() => removeService(service.id)} className="text-red-500 hover:text-red-700 transition-colors duration-200"><Trash2 className="h-4 w-4" /></button>}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div><label className="block text-sm font-medium text-[#2D2D2D] mb-1">Title *</label><input type="text" value={service.title} onChange={(e) => handleServiceChange(service.id, 'title', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200" placeholder="Service title"/></div>
                          <div><label className="block text-sm font-medium text-[#2D2D2D] mb-1">Description</label><input type="text" value={service.description} onChange={(e) => handleServiceChange(service.id, 'description', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200" placeholder="Service description"/></div>
                          <div><label className="block text-sm font-medium text-[#2D2D2D] mb-1">Quantity</label><input type="number" min="1" value={service.quantity} onChange={(e) => handleServiceChange(service.id, 'quantity', parseInt(e.target.value) || 1)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"/></div>
                          <div><label className="block text-sm font-medium text-[#2D2D2D] mb-1">Unit Price (₹) *</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><DollarSign className="h-4 w-4 text-gray-400" /></div><input type="number" min="0" value={service.unitPrice} onChange={(e) => handleServiceChange(service.id, 'unitPrice', parseInt(e.target.value) || 0)} className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200" placeholder="0"/></div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-[#2D2D2D]">Optional Add-ons</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {proposalData.addOns.map((addOn) => (<div key={addOn.id} className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${addOn.selected ? 'border-[#00BCEB] bg-[#00BCEB]/5' : 'border-gray-200 hover:border-[#00BCEB]/50'}`} onClick={() => toggleAddOn(addOn.id)}><div className="flex items-center justify-between"><div><p className="font-medium text-[#2D2D2D]">{addOn.name}</p><p className="text-sm text-gray-600">₹{addOn.price.toLocaleString()}</p></div><div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addOn.selected ? 'border-[#00BCEB] bg-[#00BCEB]' : 'border-gray-300'}`}>{addOn.selected && <Check className="h-3 w-3 text-white" />}</div></div></div>))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div><p className="font-medium text-[#2D2D2D]">Include GST in total</p><p className="text-sm text-gray-600">Add 18% GST to the final amount</p></div>
                    <button onClick={() => handleInputChange('gstEnabled', !proposalData.gstEnabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${proposalData.gstEnabled ? 'bg-[#00BCEB]' : 'bg-gray-300'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${proposalData.gstEnabled ? 'translate-x-6' : 'translate-x-1'}`}/></button>
                  </div>
                  <div className="bg-[#00BCEB]/5 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-[#2D2D2D]"><span>Subtotal:</span><span>₹{calculateSubtotal().toLocaleString()}</span></div>
                    {proposalData.gstEnabled && <div className="flex justify-between text-[#2D2D2D]"><span>GST (18%):</span><span>₹{(calculateSubtotal() * 0.18).toLocaleString()}</span></div>}
                    <div className="flex justify-between text-lg font-semibold text-[#2D2D2D] pt-2 border-t border-[#00BCEB]/20"><span>Total:</span><span>₹{calculateTotal().toLocaleString()}</span></div>
                  </div>
                </div>
              )}

              {/* --- STEP 3: Terms & Branding --- */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4">Terms & Branding</h2>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Upload Logo (Optional)</label>
                    {!logoPreview ? (<div onClick={() => document.getElementById('logo-upload')?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#00BCEB] transition-colors duration-200 cursor-pointer"><Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-600 mb-2">Click to upload your logo</p><p className="text-sm text-gray-500">PNG, JPG up to 5MB</p><input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden"/></div>) : (<div className="relative inline-block"><img src={logoPreview} alt="Logo preview" className="h-24 w-24 object-contain border border-gray-200 rounded-lg"/><button onClick={() => {setLogoPreview(null); handleInputChange('logo', null);}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"><X className="h-4 w-4" /></button></div>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Terms & Conditions Template *</label>
                    <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FileText className="h-4 w-4 text-gray-400" /></div><select value={proposalData.termsTemplate} onChange={(e) => handleInputChange('termsTemplate', e.target.value)} className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"><option value="">Select a template</option>{termsTemplates.map(template => <option key={template.value} value={template.value}>{template.label}</option>)}</select></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Footer Note (Optional)</label>
                    <textarea value={proposalData.footerNote} onChange={(e) => handleInputChange('footerNote', e.target.value)} rows={4} className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200 resize-none" placeholder="Add any personalized message or condition..."/>
                  </div>
                </div>
              )}

              {/* --- STEP 4: Preview & Send --- */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4">Preview & Send</h2>
                  <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-6">{logoPreview && <img src={logoPreview} alt="Logo" className="h-12 w-auto"/>}<div className="text-right"><h1 className="text-2xl font-bold text-[#2D2D2D]">PROPOSAL</h1><p className="text-gray-600">#{Date.now().toString().slice(-6)}</p></div></div>
                      <div className="mb-6"><h3 className="text-lg font-semibold text-[#2D2D2D] mb-2">Client Details</h3><p className="text-[#2D2D2D]">{proposalData.clientName}</p><p className="text-gray-600">{proposalData.shootType}</p><p className="text-gray-600">{new Date(proposalData.eventDate).toLocaleDateString()}</p>{proposalData.venue && <p className="text-gray-600">{proposalData.venue}</p>}</div>
                      <div className="mb-6"><h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Services</h3><div className="space-y-2">{proposalData.services.map((service) => (<div key={service.id} className="flex justify-between"><div><p className="font-medium text-[#2D2D2D]">{service.title}</p><p className="text-sm text-gray-600">{service.description}</p><p className="text-sm text-gray-600">Qty: {service.quantity}</p></div><p className="font-medium text-[#2D2D2D]">₹{(service.quantity * service.unitPrice).toLocaleString()}</p></div>))}</div></div>
                      {proposalData.addOns.some(addOn => addOn.selected) && <div className="mb-6"><h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Add-ons</h3><div className="space-y-2">{proposalData.addOns.filter(addOn => addOn.selected).map((addOn) => (<div key={addOn.id} className="flex justify-between"><p className="text-[#2D2D2D]">{addOn.name}</p><p className="font-medium text-[#2D2D2D]">₹{addOn.price.toLocaleString()}</p></div>))}</div></div>}
                      <div className="border-t pt-4"><div className="flex justify-between mb-2"><span className="text-[#2D2D2D]">Subtotal:</span><span className="text-[#2D2D2D]">₹{calculateSubtotal().toLocaleString()}</span></div>{proposalData.gstEnabled && <div className="flex justify-between mb-2"><span className="text-[#2D2D2D]">GST (18%):</span><span className="text-[#2D2D2D]">₹{(calculateSubtotal() * 0.18).toLocaleString()}</span></div>}<div className="flex justify-between text-xl font-bold text-[#2D2D2D] pt-2 border-t"><span>Total:</span><span>₹{calculateTotal().toLocaleString()}</span></div></div>
                      {proposalData.footerNote && <div className="mt-6 pt-4 border-t"><p className="text-sm text-gray-600">{proposalData.footerNote}</p></div>}
                    </div>
                  </div>
                </div>
              )}

              {/* --- NAVIGATION BUTTONS --- */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button onClick={prevStep} disabled={currentStep === 1} className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${currentStep === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-[#2D2D2D] hover:bg-gray-200'}`}><ArrowLeft className="h-4 w-4 mr-2" />Previous</button>
                {currentStep < 4 ? (<button onClick={nextStep} disabled={!isStepValid(currentStep)} className={`flex items-center px-6 py-2 rounded-lg font-medium transition-all duration-200 ${isStepValid(currentStep) ? 'bg-[#00BCEB] text-white hover:bg-[#00A5CF] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>Next<ArrowRight className="h-4 w-4 ml-2" /></button>) : (<div className="flex items-center space-x-3"><button onClick={() => setCurrentStep(3)} className="px-4 py-2 bg-gray-100 text-[#2D2D2D] rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200">Go Back</button><button onClick={handleSendProposal} disabled={isSubmitting} className={`flex items-center px-6 py-2 rounded-lg font-medium transition-all duration-200 ${!isSubmitting ? 'bg-[#00BCEB] text-white hover:bg-[#00A5CF] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>{isSubmitting ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Sending...</>) : (<><Send className="h-4 w-4 mr-2" />Send Proposal</>)}</button></div>)}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ProposalCreate;
