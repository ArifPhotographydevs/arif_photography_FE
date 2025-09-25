import React, { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import {
  Upload,
  X,
  Save,
  Copy,
  Palette,
  DollarSign,
  FileText,
  Code,
  Check,
  AlertCircle
} from 'lucide-react';

// NOTE: This file is a single-file dynamic Settings page.
// It expects back-end endpoints under /api/settings (GET/PUT) and /api/upload-logo (POST) to exist.
// If your backend uses different routes, adjust the fetch URLs below.

interface BrandingSettings {
  logoUrl: string | null; // URL from server
  logoFile?: File | null; // local file for upload
  logoPreview: string | null; // data URL while choosing
  brandColor: string;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
}

interface WhatsAppSettings {
  apiKey: string;
}

interface InvoiceSettings {
  enableGstByDefault: boolean;
  defaultCurrency: string;
  gstNumber: string;
}

interface TemplateSettings {
  tcTemplate: string;
  proposalFooter: string;
}

interface AllSettingsPayload {
  branding: {
    logoUrl: string | null;
    brandColor: string;
  };
  email: EmailSettings;
  whatsapp: WhatsAppSettings;
  invoice: InvoiceSettings;
  templates: TemplateSettings;
  leadFormUrl?: string;
}

function Settings() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Loading / saving state
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // toggles for password visibility
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  // Settings state
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>({
    logoUrl: null,
    logoFile: null,
    logoPreview: null,
    brandColor: '#00BCEB'
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: '',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: ''
  });

  const [whatsappSettings, setWhatsappSettings] = useState<WhatsAppSettings>({
    apiKey: ''
  });

  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    enableGstByDefault: false,
    defaultCurrency: '₹',
    gstNumber: ''
  });

  const [templateSettings, setTemplateSettings] = useState<TemplateSettings>({
    tcTemplate: 'standard',
    proposalFooter:
      'Thank you for choosing Arif Photography. We look forward to capturing your special moments!'
  });

  const [leadFormUrl, setLeadFormUrl] = useState<string>('');

  const tcTemplateOptions = [
    { value: 'standard', label: 'Standard Wedding Terms' },
    { value: 'premium', label: 'Premium Package Terms' },
    { value: 'corporate', label: 'Corporate Event Terms' },
    { value: 'custom', label: 'Custom Terms' }
  ];

  const currencyOptions = ['₹', '$', '€', '£', '¥'];

  // Compose lead form code dynamically from leadFormUrl
  const leadFormCode = `<iframe src="${leadFormUrl || 'https://arif-photography.com/lead-form'}" width="100%" height="600" frameborder="0"></iframe>`;

  // Fetch settings from server on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchSettings() {
      setLoading(true);
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('Failed to load settings');
        const data: AllSettingsPayload = await res.json();

        if (cancelled) return;

        // populate UI state
        setBrandingSettings({
          logoUrl: data.branding.logoUrl,
          logoFile: null,
          logoPreview: data.branding.logoUrl || null,
          brandColor: data.branding.brandColor || '#00BCEB'
        });

        setEmailSettings(data.email);
        setWhatsappSettings(data.whatsapp);
        setInvoiceSettings(data.invoice);
        setTemplateSettings(data.templates);
        setLeadFormUrl(data.leadFormUrl || 'https://arif-photography.com/lead-form');

        // set CSS variable so brand color flows through the app (optional)
        document.documentElement.style.setProperty('--brand-color', data.branding.brandColor || '#00BCEB');
      } catch (err) {
        // console.error(err);
        showToast('Could not load settings — using local defaults.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  // Helper: toast
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- Branding handlers ---
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation
      if (file.size > 5 * 1024 * 1024) {
        showToast('Logo must be smaller than 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        setBrandingSettings((prev) => ({
          ...prev,
          logoFile: file,
          logoPreview: ev.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setBrandingSettings((prev) => ({ ...prev, logoFile: null, logoPreview: prev.logoUrl || null }));
  };

  const handleBrandingChange = (field: keyof BrandingSettings, value: any) => {
    setBrandingSettings((prev) => ({ ...prev, [field]: value } as BrandingSettings));
    if (field === 'brandColor') {
      // keep CSS var in sync
      document.documentElement.style.setProperty('--brand-color', value);
    }
  };

  const saveBranding = async () => {
    setSavingSection('branding');
    try {
      // If there's a new file, upload it first
      let uploadedUrl = brandingSettings.logoUrl;
      if (brandingSettings.logoFile) {
        const fd = new FormData();
        fd.append('file', brandingSettings.logoFile);

        const res = await fetch('/api/upload-logo', {
          method: 'POST',
          body: fd
        });
        if (!res.ok) throw new Error('Logo upload failed');
        const body = await res.json();
        uploadedUrl = body.url; // backend should return { url: 'https://...' }
      }

      // Save branding payload
      const payload = {
        branding: {
          logoUrl: uploadedUrl || null,
          brandColor: brandingSettings.brandColor
        }
      };

      const saveRes = await fetch('/api/settings/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!saveRes.ok) throw new Error('Failed to save branding');

      setBrandingSettings((prev) => ({ ...prev, logoFile: null, logoUrl: uploadedUrl || null, logoPreview: uploadedUrl || prev.logoPreview }));
      showToast('Branding settings saved successfully!');
    } catch (err: any) {
      // console.error(err);
      showToast(err?.message || 'Could not save branding.');
    } finally {
      setSavingSection(null);
    }
  };

  // --- Email & WhatsApp ---
  const handleEmailChange = (field: keyof EmailSettings, value: string) => {
    setEmailSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleWhatsAppChange = (field: keyof WhatsAppSettings, value: string) => {
    setWhatsappSettings((prev) => ({ ...prev, [field]: value }));
  };

  const saveEmailWhatsApp = async () => {
    setSavingSection('email-whatsapp');
    try {
      // Basic validation example: if smtpHost provided, require username
      if (emailSettings.smtpHost && !emailSettings.smtpUsername) {
        throw new Error('SMTP username required when host is set.');
      }

      const payload = {
        email: emailSettings,
        whatsapp: whatsappSettings
      };

      const res = await fetch('/api/settings/communication', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save communication settings');

      showToast('Email & WhatsApp settings saved successfully!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save settings');
    } finally {
      setSavingSection(null);
    }
  };

  // --- Invoice ---
  const handleInvoiceChange = (field: keyof InvoiceSettings, value: any) => {
    setInvoiceSettings((prev) => ({ ...prev, [field]: value }));
  };

  const saveInvoiceSettings = async () => {
    setSavingSection('invoice');
    try {
      const payload = { invoice: invoiceSettings };
      const res = await fetch('/api/settings/invoice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save invoice settings');
      showToast('Invoice settings saved successfully!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save invoice settings');
    } finally {
      setSavingSection(null);
    }
  };

  // --- Templates ---
  const handleTemplateChange = (field: keyof TemplateSettings, value: string) => {
    setTemplateSettings((prev) => ({ ...prev, [field]: value }));
  };

  const saveTemplates = async () => {
    setSavingSection('templates');
    try {
      const payload = { templates: templateSettings };
      const res = await fetch('/api/settings/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save templates');
      showToast('Templates updated successfully!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update templates');
    } finally {
      setSavingSection(null);
    }
  };

  // Copy lead form code
  const copyLeadFormCode = async () => {
    try {
      await navigator.clipboard.writeText(leadFormCode);
      showToast('Lead form code copied to clipboard!');
    } catch (err) {
      showToast('Could not copy to clipboard.');
    }
  };

  // UI while loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4 inline-block h-8 w-8 rounded-full border-4 border-t-transparent" />
          <div className="text-gray-600">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {/* Header */}
        <Header title="Studio Settings" sidebarCollapsed={sidebarCollapsed} />

        {/* Main Content */}
        <main className="pt-16 p-6">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2">Studio Settings</h2>
            <p className="text-gray-600">Manage your preferences and integrations</p>
          </div>

          {/* Settings Sections */}
          <div className="space-y-6">
            {/* Branding */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <Palette className="h-5 w-5 text-[var(--brand-color,#00BCEB)] mr-3" />
                <h3 className="text-xl font-semibold text-[#2D2D2D]">Branding</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-3">Studio Logo</label>

                  {!brandingSettings.logoPreview ? (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[var(--brand-color,#00BCEB)] transition-colors duration-200 cursor-pointer"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-1">Click to upload your logo</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="relative inline-block">
                      <img
                        src={brandingSettings.logoPreview || undefined}
                        alt="Logo preview"
                        className="h-24 w-auto object-contain border border-gray-200 rounded-lg"
                      />
                      <button
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-3">Brand Color</label>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <input
                        type="color"
                        value={brandingSettings.brandColor}
                        onChange={(e) => handleBrandingChange('brandColor', e.target.value)}
                        className="w-16 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={brandingSettings.brandColor}
                        onChange={(e) => handleBrandingChange('brandColor', e.target.value)}
                        className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#00BCEB)] focus:border-[var(--brand-color,#00BCEB)] transition-all duration-200"
                        placeholder="#00BCEB"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={saveBranding}
                  disabled={savingSection === 'branding'}
                  className="flex items-center px-6 py-2 bg-[var(--brand-color,#00BCEB)] text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingSection === 'branding' ? 'Saving...' : 'Save Branding'}
                </button>
              </div>
            </div>

            {/* Invoice */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <DollarSign className="h-5 w-5 text-[var(--brand-color,#00BCEB)] mr-3" />
                <h3 className="text-xl font-semibold text-[#2D2D2D]">Invoice Settings</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#2D2D2D]">Enable GST by Default</p>
                    <p className="text-sm text-gray-600">Automatically include GST in new invoices</p>
                  </div>
                  <button
                    onClick={() => handleInvoiceChange('enableGstByDefault', !invoiceSettings.enableGstByDefault)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      invoiceSettings.enableGstByDefault ? 'bg-[var(--brand-color,#00BCEB)]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        invoiceSettings.enableGstByDefault ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Default Currency Symbol</label>
                    <select
                      value={invoiceSettings.defaultCurrency}
                      onChange={(e) => handleInvoiceChange('defaultCurrency', e.target.value)}
                      className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#00BCEB)] focus:border-[var(--brand-color,#00BCEB)] transition-all duration-200"
                    >
                      {currencyOptions.map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">GST Number (Optional)</label>
                    <input
                      type="text"
                      value={invoiceSettings.gstNumber}
                      onChange={(e) => handleInvoiceChange('gstNumber', e.target.value)}
                      className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#00BCEB)] focus:border-[var(--brand-color,#00BCEB)] transition-all duration-200"
                      placeholder="Enter GST number"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      This information will appear on all invoices generated from the system.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={saveInvoiceSettings}
                  disabled={savingSection === 'invoice'}
                  className="flex items-center px-6 py-2 bg-[var(--brand-color,#00BCEB)] text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingSection === 'invoice' ? 'Saving...' : 'Save Invoice Settings'}
                </button>
              </div>
            </div>

            {/* Templates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <FileText className="h-5 w-5 text-[var(--brand-color,#00BCEB)] mr-3" />
                <h3 className="text-xl font-semibold text-[#2D2D2D]">Templates</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Terms & Conditions Template</label>
                  <select
                    value={templateSettings.tcTemplate}
                    onChange={(e) => handleTemplateChange('tcTemplate', e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#00BCEB)] focus:border-[var(--brand-color,#00BCEB)] transition-all duration-200"
                  >
                    {tcTemplateOptions.map((template) => (
                      <option key={template.value} value={template.value}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Proposal Footer Note</label>
                  <textarea
                    value={templateSettings.proposalFooter}
                    onChange={(e) => handleTemplateChange('proposalFooter', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#00BCEB)] focus:border-[var(--brand-color,#00BCEB)] transition-all duration-200 resize-none"
                    placeholder="Enter your default proposal footer message..."
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={saveTemplates}
                  disabled={savingSection === 'templates'}
                  className="flex items-center px-6 py-2 bg-[var(--brand-color,#00BCEB)] text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingSection === 'templates' ? 'Saving...' : 'Update Templates'}
                </button>
              </div>
            </div>

            {/* Lead Form Generator */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <Code className="h-5 w-5 text-[var(--brand-color,#00BCEB)] mr-3" />
                <h3 className="text-xl font-semibold text-[#2D2D2D]">Lead Form Generator</h3>
              </div>

              <div>
                <p className="text-gray-600 mb-4">Embed your lead form on your website to capture inquiries directly into your CRM.</p>

                <div className="relative">
                  <textarea
                    value={leadFormCode}
                    readOnly
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-[#2D2D2D] font-mono text-sm resize-none"
                  />
                  <button
                    onClick={copyLeadFormCode}
                    className="absolute top-2 right-2 p-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#e55a00] transition-colors duration-200"
                    title="Copy Code"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4">
                  <button
                    onClick={copyLeadFormCode}
                    className="flex items-center px-6 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center">
            <Check className="h-4 w-4 mr-2" />
            <p className="font-medium">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
  