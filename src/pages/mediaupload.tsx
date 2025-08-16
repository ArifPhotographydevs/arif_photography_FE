import React, { useState, useRef, useCallback } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  Upload,
  X,
  Image,
  Video,
  File,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  Save,
  ArrowLeft,
  Camera,
  Calendar,
  User,
  Tag,
  FileText,
  Loader,
  ChevronDown
} from 'lucide-react';

interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  metadata: {
    title: string;
    description: string;
    shootType: string;
    clientName: string;
    projectId: string;
    eventDate: string;
    tags: string[];
    isWatermarked: boolean;
    isPinProtected: boolean;
  };
}

interface Project {
  id: string;
  name: string;
  clientName: string;
}

function MediaUpload() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [bulkMetadata, setBulkMetadata] = useState({
    shootType: '',
    clientName: '',
    projectId: '',
    eventDate: '',
    isWatermarked: false,
    isPinProtected: false
  });
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'metadata'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Mock projects data
  const [projects] = useState<Project[]>([
    { id: 'PRJ-2024-001', name: 'Sarah & John Wedding', clientName: 'Sarah & John' },
    { id: 'PRJ-2024-002', name: 'Raj & Priya Pre-Wedding', clientName: 'Raj & Priya' },
    { id: 'PRJ-2024-003', name: 'Emma Wilson Maternity', clientName: 'Emma Wilson' },
    { id: 'PRJ-2024-004', name: 'TechCorp Corporate', clientName: 'TechCorp' },
    { id: 'PRJ-2024-005', name: 'Arjun Kumar Portrait', clientName: 'Arjun Kumar' }
  ]);

  const shootTypes = ['Wedding', 'Pre-Wedding', 'Maternity', 'Corporate', 'Portrait', 'Events'];

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadFile[] = Array.from(files).map(file => {
      const id = Math.random().toString(36).substring(7);
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      
      return {
        id,
        file,
        preview,
        progress: 0,
        status: 'pending',
        metadata: {
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: '',
          shootType: bulkMetadata.shootType,
          clientName: bulkMetadata.clientName,
          projectId: bulkMetadata.projectId,
          eventDate: bulkMetadata.eventDate || new Date().toISOString().split('T')[0],
          tags: [],
          isWatermarked: bulkMetadata.isWatermarked,
          isPinProtected: bulkMetadata.isPinProtected
        }
      };
    });

    setUploadFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (id: string) => {
    setUploadFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const updateFileMetadata = (id: string, field: string, value: any) => {
    setUploadFiles(prev => 
      prev.map(file => 
        file.id === id 
          ? { ...file, metadata: { ...file.metadata, [field]: value } }
          : file
      )
    );
  };

  const applyBulkMetadata = () => {
    setUploadFiles(prev => 
      prev.map(file => ({
        ...file,
        metadata: {
          ...file.metadata,
          ...bulkMetadata,
          projectId: bulkMetadata.projectId,
          clientName: projects.find(p => p.id === bulkMetadata.projectId)?.clientName || bulkMetadata.clientName
        }
      }))
    );
    setShowBulkEdit(false);
  };

  const simulateUpload = async (file: UploadFile) => {
    const updateProgress = (progress: number) => {
      setUploadFiles(prev => 
        prev.map(f => 
          f.id === file.id ? { ...f, progress, status: 'uploading' } : f
        )
      );
    };

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      updateProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Simulate completion
    setUploadFiles(prev => 
      prev.map(f => 
        f.id === file.id ? { ...f, status: 'completed' } : f
      )
    );
  };

  const handleUpload = async () => {
    setIsUploading(true);
    
    const filesToUpload = uploadFiles.filter(f => f.status === 'pending');
    
    // Upload files concurrently
    await Promise.all(filesToUpload.map(simulateUpload));
    
    setIsUploading(false);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.startsWith('video/')) return Video;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <Header title="Media Upload" sidebarCollapsed={sidebarCollapsed} />

        {/* Main Content */}
        <main className="pt-16 p-6">
          {/* Top Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center mb-2">
                <button
                  onClick={() => window.history.back()}
                  className="mr-3 p-2 text-gray-400 hover:text-[#00BCEB] hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="text-2xl font-bold text-[#2D2D2D]">Media Upload</h2>
              </div>
              <p className="text-gray-600">Upload and organize your project media files</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowBulkEdit(!showBulkEdit)}
                className="flex items-center px-4 py-2 border border-[#00BCEB] text-[#00BCEB] rounded-lg font-medium hover:bg-[#00BCEB] hover:text-white transition-colors duration-200"
              >
                <Tag className="h-4 w-4 mr-2" />
                Bulk Edit
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadFiles.length === 0 || isUploading}
                className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isUploading ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isUploading ? 'Uploading...' : 'Upload All'}
              </button>
            </div>
          </div>

          {/* Bulk Edit Panel */}
          {showBulkEdit && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
              <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Bulk Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Project</label>
                  <select
                    value={bulkMetadata.projectId}
                    onChange={(e) => setBulkMetadata(prev => ({
                      ...prev,
                      projectId: e.target.value,
                      clientName: projects.find(p => p.id === e.target.value)?.clientName || ''
                    }))}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  >
                    <option value="">Select Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Shoot Type</label>
                  <select
                    value={bulkMetadata.shootType}
                    onChange={(e) => setBulkMetadata(prev => ({ ...prev, shootType: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  >
                    <option value="">Select Type</option>
                    {shootTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Event Date</label>
                  <input
                    type="date"
                    value={bulkMetadata.eventDate}
                    onChange={(e) => setBulkMetadata(prev => ({ ...prev, eventDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6 mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={bulkMetadata.isWatermarked}
                    onChange={(e) => setBulkMetadata(prev => ({ ...prev, isWatermarked: e.target.checked }))}
                    className="mr-2 h-4 w-4 text-[#00BCEB] focus:ring-[#00BCEB] border-gray-300 rounded"
                  />
                  <span className="text-sm text-[#2D2D2D]">Apply Watermark</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={bulkMetadata.isPinProtected}
                    onChange={(e) => setBulkMetadata(prev => ({ ...prev, isPinProtected: e.target.checked }))}
                    className="mr-2 h-4 w-4 text-[#FF6B00] focus:ring-[#FF6B00] border-gray-300 rounded"
                  />
                  <span className="text-sm text-[#2D2D2D]">PIN Protection</span>
                </label>
              </div>

              <div className="flex items-center space-x-3 mt-4">
                <button
                  onClick={applyBulkMetadata}
                  className="flex items-center px-4 py-2 bg-[#00BCEB] text-white rounded-lg font-medium hover:bg-[#00A5CF] transition-colors duration-200"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Apply to All
                </button>
                <button
                  onClick={() => setShowBulkEdit(false)}
                  className="flex items-center px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Upload Zone */}
            <div className="xl:col-span-2">
              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                  isDragOver 
                    ? 'border-[#00BCEB] bg-[#00BCEB]/5' 
                    : 'border-gray-300 hover:border-[#00BCEB] hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />

                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-[#FF6B00]/10 rounded-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-[#FF6B00]" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-[#2D2D2D] mb-2">
                      {isDragOver ? 'Drop your files here' : 'Upload Media Files'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Drag and drop your images and videos, or click to browse
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Browse Files
                    </button>
                  </div>

                  <div className="text-sm text-gray-400">
                    Supported formats: JPG, PNG, GIF, MP4, MOV, AVI
                  </div>
                </div>
              </div>

              {/* File List */}
              {uploadFiles.length > 0 && (
                <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-100">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-[#2D2D2D]">
                      Files to Upload ({uploadFiles.length})
                    </h3>
                  </div>
                  
                  <div className="divide-y divide-gray-100">
                    {uploadFiles.map((uploadFile) => {
                      const FileIcon = getFileIcon(uploadFile.file);
                      
                      return (
                        <div key={uploadFile.id} className="p-4">
                          <div className="flex items-start space-x-4">
                            {/* File Preview/Icon */}
                            <div className="flex-shrink-0">
                              {uploadFile.preview ? (
                                <img
                                  src={uploadFile.preview}
                                  alt={uploadFile.file.name}
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <FileIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-[#2D2D2D] truncate">
                                    {uploadFile.metadata.title}
                                  </h4>
                                  <p className="text-sm text-gray-500 truncate">
                                    {uploadFile.file.name} • {formatFileSize(uploadFile.file.size)}
                                  </p>
                                  
                                  {/* Progress Bar */}
                                  {uploadFile.status === 'uploading' && (
                                    <div className="mt-2">
                                      <div className="bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-[#00BCEB] h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${uploadFile.progress}%` }}
                                        />
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">{uploadFile.progress}% uploaded</p>
                                    </div>
                                  )}

                                  {/* Status */}
                                  <div className="flex items-center mt-2">
                                    {uploadFile.status === 'completed' && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <Check className="h-3 w-3 mr-1" />
                                        Completed
                                      </span>
                                    )}
                                    {uploadFile.status === 'error' && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Error
                                      </span>
                                    )}
                                    {uploadFile.status === 'pending' && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() => removeFile(uploadFile.id)}
                                  className="ml-4 p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              {/* Quick Metadata */}
                              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                <input
                                  type="text"
                                  placeholder="Title"
                                  value={uploadFile.metadata.title}
                                  onChange={(e) => updateFileMetadata(uploadFile.id, 'title', e.target.value)}
                                  className="px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                                />
                                <select
                                  value={uploadFile.metadata.shootType}
                                  onChange={(e) => updateFileMetadata(uploadFile.id, 'shootType', e.target.value)}
                                  className="px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                                >
                                  <option value="">Shoot Type</option>
                                  {shootTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Upload Summary */}
            <div className="space-y-6">
              {/* Stats Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-[#2D2D2D] mb-4">Upload Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Files</span>
                    <span className="font-medium text-[#2D2D2D]">{uploadFiles.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-medium text-green-600">
                      {uploadFiles.filter(f => f.status === 'completed').length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="font-medium text-[#FF6B00]">
                      {uploadFiles.filter(f => f.status === 'pending').length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Errors</span>
                    <span className="font-medium text-red-600">
                      {uploadFiles.filter(f => f.status === 'error').length}
                    </span>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#2D2D2D]">Total Size</span>
                      <span className="font-medium text-[#2D2D2D]">
                        {formatFileSize(uploadFiles.reduce((acc, f) => acc + f.file.size, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-[#2D2D2D] mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview All
                  </button>
                  
                  <button
                    onClick={() => setUploadFiles([])}
                    className="w-full flex items-center justify-center px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-[#00BCEB]/5 rounded-lg p-6">
                <h3 className="font-semibold text-[#2D2D2D] mb-3">Upload Tips</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-[#00BCEB] rounded-full mt-2 mr-3 flex-shrink-0" />
                    Use bulk edit to apply metadata to multiple files
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-[#00BCEB] rounded-full mt-2 mr-3 flex-shrink-0" />
                    Organize files by project for better management
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-[#00BCEB] rounded-full mt-2 mr-3 flex-shrink-0" />
                    Add watermarks and PIN protection as needed
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default MediaUpload;