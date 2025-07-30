import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Eye, 
  EyeOff, 
  Lock, 
  Image, 
  FileText, 
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  title: string;
}

function GalleryUpload() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMessages, setUploadMessages] = useState<string[]>([]);


  // Settings
  const [settings, setSettings] = useState({
    enableFaceTagging: false,
    applyWatermark: true,
    protectWithPin: false,
    pin: ''
  });

  const [showPin, setShowPin] = useState(false);

  // Mock project data
  const projectData = {
    id: projectId,
    title: 'Sarah & John Wedding',
    clientName: 'Sarah Johnson',
    eventDate: '2024-03-15',
    shootType: 'Wedding'
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: UploadedFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          file,
          preview: e.target?.result as string,
          title: file.name.replace(/\.[^/.]+$/, '')
        };
        setUploadedFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateFileTitle = (fileId: string, title: string) => {
    setUploadedFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, title } : f)
    );
  };

  const handleSettingChange = (setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

 const handleUpload = async () => {
  if (uploadedFiles.length === 0) return;

  setIsUploading(true);
  setUploadProgress(0);
  setUploadMessages([]);

  const folder = `projects/gallery/${projectId}`;
  const fileNames = uploadedFiles.map(file => file.file.name);

  try {
    // Step 1: Request presigned URLs
    const response = await fetch("https://e16ufjl300.execute-api.eu-north-1.amazonaws.com/default/bulkupload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: fileNames, folder })
    });

    const result = await response.json();
    if (!result.success || result.urls.length !== uploadedFiles.length) {
      setUploadMessages(["❌ Error: Mismatch in URL count"]);
      setIsUploading(false);
      return;
    }

    // Step 2: Upload files in parallel
    let completed = 0;
    await Promise.all(uploadedFiles.map((fileObj, i) => {
      const url = result.urls[i];
      return fetch(url, {
        method: "PUT",
        body: fileObj.file
      }).then(res => {
        if (!res.ok) throw new Error(`Failed: ${fileObj.file.name}`);
        completed++;
        setUploadProgress(Math.round((completed / uploadedFiles.length) * 100));
        setUploadMessages(prev => [...prev, `✅ ${fileObj.file.name} uploaded`]);
      }).catch(err => {
        setUploadMessages(prev => [...prev, `❌ ${fileObj.file.name} failed: ${err.message}`]);
      });
    }));

    setUploadMessages(prev => [...prev, `✅ Upload completed.`]);

    // Optional: Auto redirect
    setTimeout(() => navigate('/gallery'), 2000);
  } catch (err: any) {
    setUploadMessages([`❌ Error: ${err.message}`]);
  } finally {
    setIsUploading(false);
  }
};


  const isFormValid = () => {
    if (uploadedFiles.length === 0) return false;
    if (settings.protectWithPin && settings.pin.length !== 4) return false;
    return true;
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
        <Header title="Upload Gallery" sidebarCollapsed={sidebarCollapsed} />

        {/* Main Content */}
        <main className="pt-16 p-6">
          {/* Back Button */}
          <button
            onClick={() => navigate('/gallery')}
            className="flex items-center text-[#00BCEB] hover:text-[#00A5CF] mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gallery
          </button>

          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h1 className="text-2xl font-bold text-[#2D2D2D] mb-2">
              Upload Gallery – {projectData.title}
            </h1>
            <div className="flex items-center space-x-4 text-gray-600">
              <span>{new Date(projectData.eventDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
              <span>•</span>
              <span>{projectData.clientName}</span>
              <span>•</span>
              <span>{projectData.shootType}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upload Zone */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Upload Files</h3>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? 'border-[#00BCEB] bg-[#00BCEB]/5'
                      : 'border-gray-300 hover:border-[#00BCEB] hover:bg-[#00BCEB]/5'
                  }`}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-[#2D2D2D] mb-2">
                    Drop files here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports JPG, PNG, HEIC files up to 50MB each
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-4">
                    <div className="text-right text-sm text-gray-500">
  Uploading {uploadProgress}% of {uploadedFiles.length} file(s)
</div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#00BCEB] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {uploadMessages.length > 0 && (
  <div className="mt-4 space-y-1 text-sm">
    {uploadMessages.map((msg, index) => (
      <p key={index} className={msg.startsWith("✅") ? "text-green-600" : "text-red-600"}>
        {msg}
      </p>
    ))}
  </div>
)}

              </div>

              {/* Uploaded Files Preview */}
              {uploadedFiles.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">
                    Uploaded Files ({uploadedFiles.length})
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={file.preview}
                            alt={file.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => removeFile(file.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>

                        {/* Title Input */}
                        <input
                          type="text"
                          value={file.title}
                          onChange={(e) => updateFileTitle(file.id, e.target.value)}
                          className="mt-2 w-full px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#00BCEB] focus:border-[#00BCEB]"
                          placeholder="Image title"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Settings Panel */}
            <div className="space-y-6">
              {/* Smart Features */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Smart Features</h3>
                
                <div className="space-y-4">
                  {/* Face Tagging */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#2D2D2D]">Enable Face Tagging</p>
                      <p className="text-sm text-gray-600">Automatically detect and tag faces</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('enableFaceTagging', !settings.enableFaceTagging)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        settings.enableFaceTagging ? 'bg-[#00BCEB]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          settings.enableFaceTagging ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Watermark */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#2D2D2D]">Apply Watermark</p>
                      <p className="text-sm text-gray-600">Add studio watermark to images</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('applyWatermark', !settings.applyWatermark)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        settings.applyWatermark ? 'bg-[#00BCEB]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          settings.applyWatermark ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* PIN Protection */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#2D2D2D]">Protect Gallery with PIN</p>
                      <p className="text-sm text-gray-600">Secure client access with PIN</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('protectWithPin', !settings.protectWithPin)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        settings.protectWithPin ? 'bg-[#00BCEB]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          settings.protectWithPin ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* PIN Input */}
              {settings.protectWithPin && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">PIN Protection</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                      Enter 4-digit PIN for client access
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={settings.pin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          handleSettingChange('pin', value);
                        }}
                        className="w-full pl-10 pr-12 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                        placeholder="0000"
                        maxLength={4}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#00BCEB] transition-colors duration-200"
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {settings.pin.length > 0 && settings.pin.length < 4 && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        PIN must be 4 digits
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Upload Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Upload Summary</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Files to upload:</span>
                    <span className="font-medium text-[#2D2D2D]">{uploadedFiles.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Face tagging:</span>
                    <span className={`font-medium ${settings.enableFaceTagging ? 'text-green-600' : 'text-gray-400'}`}>
                      {settings.enableFaceTagging ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Watermark:</span>
                    <span className={`font-medium ${settings.applyWatermark ? 'text-green-600' : 'text-gray-400'}`}>
                      {settings.applyWatermark ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">PIN protection:</span>
                    <span className={`font-medium ${settings.protectWithPin ? 'text-green-600' : 'text-gray-400'}`}>
                      {settings.protectWithPin ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleUpload}
                  disabled={!isFormValid() || isUploading}
                  className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isFormValid() && !isUploading
                      ? 'bg-[#00BCEB] text-white hover:bg-[#00A5CF] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Gallery
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => navigate('/gallery')}
                  disabled={isUploading}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default GalleryUpload;