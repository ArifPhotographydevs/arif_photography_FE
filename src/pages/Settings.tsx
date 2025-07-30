import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  Upload, 
  X, 
  Save, 
  Copy, 
  Eye, 
  EyeOff, 
  Palette, 
  Mail, 
  MessageCircle, 
  DollarSign, 
  FileText, 
  Code, 
  Check,
  AlertCircle,
  Settings as SettingsIcon
} from 'lucide-react';

interface BrandingSettings {
  logo: File | null;
  logoPreview: string | null;
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

function Settings() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showWhatsAppKey, setShowWhatsAppKey] = useState(false);

  // Settings state
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>({
    logo: null,
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
    proposalFooter: 'Thank you for choosing Arif Photography. We look forward to capturing your special moments!'
  });

  const tcTemplateOptions = [
    { value: 'standard', label: 'Standard Wedding Terms' },
    { value: 'premium', label: 'Premium Package Terms' },
    { value: 'corporate', label: 'Corporate Event Terms' },
    { value: 'custom', label: 'Custom Terms' }
  ];

  const currencyOptions = ['₹', '$', '€', '£', '¥'];

  const leadFormCode = `<iframe src="https://arif-photography.com/lead-form" width="100%" height="600" frameborder="0"></iframe>`;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBrandingSettings(prev => ({ ...prev, logo: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setBrandingSettings(prev => ({ 
          ...prev, 
          logoPreview: e.target?.result as string 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setBrandingSettings(prev => ({
      ...prev,
      logo: null,
      logoPreview: null
    }));
  };

  const handleBrandingChange = (field: string, value: any) => {
    setBrandingSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmailChange = (field: string, value: string) => {
    setEmailSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWhatsAppChange = (field: string, value: string) => {
    setWhatsappSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInvoiceChange = (field: string, value: any) => {
    setInvoiceSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTemplateChange = (field: string, value: string) => {
    setTemplateSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveBranding = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    showToastMessage('Branding settings saved successfully!');
  };

  const saveEmailWhatsApp = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    showToastMessage('Email & WhatsApp settings saved successfully!');
  };

  const saveInvoiceSettings = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    showToastMessage('Invoice settings saved successfully!');
  };

  const saveTemplates = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    showToastMessage('Templates updated successfully!');
  };

  const copyLeadFormCode = () => {
    navigator.clipboard.writeText(leadFormCode);
    showToastMessage('Lead form code copied to clipboard!');
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
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
            {/* Section 1: Branding */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <Palette className="h-5 w-5 text-[#00BCEB] mr-3" />
                <h3 className="text-xl font-semibold text-[#2D2D2D]">Branding</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-3">
                    Studio Logo
                  </label>
                  
                  {!brandingSettings.logoPreview ? (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#00BCEB] transition-colors duration-200 cursor-pointer"
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
                        src={brandingSettings.logoPreview}
                        alt="Logo preview"
                        className="h-24 w-auto object-contain border border-gray-200 rounded-lg"
                      />
                      <button
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Brand Color */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-3">
                    Brand Color
                  </label>
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
                        className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                        placeholder="#00BCEB"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={saveBranding}
                  className="flex items-center px-6 py-2 bg-[#00BCEB] text-white rounded-lg font-medium hover:bg-[#00A5CF] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Branding
                </button>
              </div>
            </div>

            {/* Section 2: Email & WhatsApp Configuration */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <Mail className="h-5 w-5 text-[#00BCEB] mr-3" />
                <h3 className="text-xl font-semibold text-[#2D2D2D]">Email & WhatsApp Configuration</h3>
              </div>

              <div className="space-y-6">
                {/* SMTP Settings */}
                <div>
                  <h4 className="text-lg font-medium text-[#2D2D2D] mb-4">SMTP Email Setup</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                        SMTP Host
                      </label>
                      <input
                        type="text"
                        value={emailSettings.smtpHost}
                        onChange={(e) => handleEmailChange('smtpHost', e.target.value)}
                        className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                        Port
                      </label>
                      <input
                        type="text"
                        value={emailSettings.smtpPort}
                        onChange={(e) => handleEmailChange('smtpPort', e.target.value)}
                        className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                        placeholder="587"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={emailSettings.smtpUsername}
                        onChange={(e) => handleEmailChange('smtpUsername', e.target.value)}
                        className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showSmtpPassword ? 'text' : 'password'}
                          value={emailSettings.smtpPassword}
                          onChange={(e) => handleEmailChange('smtpPassword', e.target.value)}
                          className="w-full px-3 py-2 pr-10 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                          placeholder="App password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#00BCEB] transition-colors duration-200"
                        >
                          {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Settings */}
                <div>
                  <h4 className="text-lg font-medium text-[#2D2D2D] mb-4">WhatsApp Integration</h4>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                      WhatsApp API Key
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MessageCircle className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type={showWhatsAppKey ? 'text' : 'password'}
                        value={whatsappSettings.apiKey}
                        onChange={(e) => handleWhatsAppChange('apiKey', e.target.value)}
                        className="w-full pl-10 pr-10 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                        placeholder="Enter your WhatsApp API key"
                      />
                      <button
                        type="button"
                        onClick={() => setShowWhatsAppKey(!showWhatsAppKey)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#00BCEB] transition-colors duration-200"
                      >
                        {showWhatsAppKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={saveEmailWhatsApp}
                  className="flex items-center px-6 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </button>
              </div>
            </div>

            {/* Section 3: Invoice Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <DollarSign className="h-5 w-5 text-[#00BCEB] mr-3" />
                <h3 className="text-xl font-semibold text-[#2D2D2D]">Invoice Settings</h3>
              </div>

              <div className="space-y-6">
                {/* GST Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#2D2D2D]">Enable GST by Default</p>
                    <p className="text-sm text-gray-600">Automatically include GST in new invoices</p>
                  </div>
                  <button
                    onClick={() => handleInvoiceChange('enableGstByDefault', !invoiceSettings.enableGstByDefault)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      invoiceSettings.enableGstByDefault ? 'bg-[#00BCEB]' : 'bg-gray-300'
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
                  {/* Default Currency */}
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                      Default Currency Symbol
                    </label>
                    <select
                      value={invoiceSettings.defaultCurrency}
                      onChange={(e) => handleInvoiceChange('defaultCurrency', e.target.value)}
                      className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                    >
                      {currencyOptions.map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                  </div>

                  {/* GST Number */}
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                      GST Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={invoiceSettings.gstNumber}
                      onChange={(e) => handleInvoiceChange('gstNumber', e.target.value)}
                      className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
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
                  className="flex items-center px-6 py-2 bg-[#00BCEB] text-white rounded-lg font-medium hover:bg-[#00A5CF] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Invoice Settings
                </button>
              </div>
            </div>

            {/* Section 4: Templates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <FileText className="h-5 w-5 text-[#00BCEB] mr-3" />
                <h3 className="text-xl font-semibold text-[#2D2D2D]">Templates</h3>
              </div>

              <div className="space-y-6">
                {/* T&C Template */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Terms & Conditions Template
                  </label>
                  <select
                    value={templateSettings.tcTemplate}
                    onChange={(e) => handleTemplateChange('tcTemplate', e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  >
                    {tcTemplateOptions.map(template => (
                      <option key={template.value} value={template.value}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Proposal Footer */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Proposal Footer Note
                  </label>
                  <textarea
                    value={templateSettings.proposalFooter}
                    onChange={(e) => handleTemplateChange('proposalFooter', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200 resize-none"
                    placeholder="Enter your default proposal footer message..."
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={saveTemplates}
                  className="flex items-center px-6 py-2 bg-[#00BCEB] text-white rounded-lg font-medium hover:bg-[#00A5CF] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Update Templates
                </button>
              </div>
            </div>

            {/* Section 5: Lead Form Generator */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <Code className="h-5 w-5 text-[#00BCEB] mr-3" />
                <h3 className="text-xl font-semibold text-[#2D2D2D]">Lead Form Generator</h3>
              </div>

              <div>
                <p className="text-gray-600 mb-4">
                  Embed your lead form on your website to capture inquiries directly into your CRM.
                </p>
                
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
      {showToast && (
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