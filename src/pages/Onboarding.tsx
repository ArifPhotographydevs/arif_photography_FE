import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Palette, Camera, Settings, CheckCircle2, X } from 'lucide-react';

interface OnboardingData {
  logo: File | null;
  brandColor: string;
  shootTypes: string[];
  gstEnabled: boolean;
}

function Onboarding() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<OnboardingData>({
    logo: null,
    brandColor: '#00BCEB',
    shootTypes: [],
    gstEnabled: false
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const shootTypeOptions = [
    'Wedding',
    'Pre-Wedding',
    'Maternity',
    'Events',
    'Portrait',
    'Corporate',
    'Fashion',
    'Product'
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, logo: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setFormData(prev => ({ ...prev, logo: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logo: null }));
    setLogoPreview(null);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, brandColor: e.target.value }));
  };

  const toggleShootType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      shootTypes: prev.shootTypes.includes(type)
        ? prev.shootTypes.filter(t => t !== type)
        : [...prev.shootTypes, type]
    }));
  };

  const handleGstToggle = () => {
    setFormData(prev => ({ ...prev, gstEnabled: !prev.gstEnabled }));
  };

  const handleContinue = async () => {
    if (!formData.brandColor) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call to save onboarding data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Onboarding failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#00BCEB] to-[#00A5CF] rounded-full mb-4">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2">Let's set up your studio!</h1>
          <p className="text-gray-600 text-lg">Customize your experience in just a few steps.</p>
        </div>

        {/* Onboarding Sections */}
        <div className="space-y-6">
          {/* Upload Studio Logo */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <Upload className="h-5 w-5 text-[#00BCEB] mr-2" />
              <h3 className="text-lg font-semibold text-[#2D2D2D]">Upload Studio Logo</h3>
            </div>
            
            {!logoPreview ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#00BCEB] transition-colors duration-200 cursor-pointer"
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag & drop your logo here or click to upload</p>
                <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
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
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-24 w-24 object-contain border border-gray-200 rounded-lg"
                />
                <button
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Choose Brand Color */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <Palette className="h-5 w-5 text-[#00BCEB] mr-2" />
              <h3 className="text-lg font-semibold text-[#2D2D2D]">Choose Brand Color</h3>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="color"
                  value={formData.brandColor}
                  onChange={handleColorChange}
                  className="w-16 h-16 rounded-lg border-2 border-gray-200 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Hex Code
                </label>
                <input
                  type="text"
                  value={formData.brandColor}
                  onChange={handleColorChange}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  placeholder="#00BCEB"
                />
              </div>
            </div>
          </div>

          {/* Select Default Shoot Types */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <Camera className="h-5 w-5 text-[#00BCEB] mr-2" />
              <h3 className="text-lg font-semibold text-[#2D2D2D]">Select Default Shoot Types</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {shootTypeOptions.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleShootType(type)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                    formData.shootTypes.includes(type)
                      ? 'bg-[#00BCEB] border-[#00BCEB] text-white'
                      : 'bg-white border-gray-200 text-[#2D2D2D] hover:border-[#00BCEB]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Enable GST */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <Settings className="h-5 w-5 text-[#00BCEB] mr-2" />
              <h3 className="text-lg font-semibold text-[#2D2D2D]">Enable GST</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#2D2D2D] font-medium">Enable GST for invoices?</p>
                {formData.gstEnabled && (
                  <p className="text-sm text-gray-600 mt-1">You can update GST details in Settings later.</p>
                )}
              </div>
              <button
                onClick={handleGstToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  formData.gstEnabled ? 'bg-[#00BCEB]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    formData.gstEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="mt-8">
          <button
            onClick={handleContinue}
            disabled={isLoading}
            className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center ${
              !isLoading
                ? 'bg-[#00BCEB] hover:bg-[#00A5CF] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Setting up your studio...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Continue to Dashboard
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <p className="font-medium">Please select a brand color before continuing.</p>
        </div>
      )}
    </div>
  );
}

export default Onboarding;