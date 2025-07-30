import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  Edit3, 
  Filter,
  Image,
  Calendar,
  User,
  Camera,
  ExternalLink,
  Download,
  Share2
} from 'lucide-react';

interface GalleryItem {
  id: string;
  projectId: string;
  clientName: string;
  shootType: string;
  eventDate: string;
  imageUrl: string;
  title: string;
  uploadDate: string;
  isWatermarked: boolean;
  isPinProtected: boolean;
}

function Gallery() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState({
    clientName: '',
    month: '',
    shootType: '',
    search: ''
  });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);

  // Mock gallery data
  const [galleryItems] = useState<GalleryItem[]>([
    {
      id: '1',
      projectId: 'PRJ-2024-001',
      clientName: 'Sarah & John',
      shootType: 'Wedding',
      eventDate: '2024-03-15',
      imageUrl: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'Wedding Ceremony',
      uploadDate: '2024-03-16',
      isWatermarked: true,
      isPinProtected: true
    },
    {
      id: '2',
      projectId: 'PRJ-2024-002',
      clientName: 'Raj & Priya',
      shootType: 'Pre-Wedding',
      eventDate: '2024-02-28',
      imageUrl: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'Beach Session',
      uploadDate: '2024-03-01',
      isWatermarked: false,
      isPinProtected: false
    },
    {
      id: '3',
      projectId: 'PRJ-2024-003',
      clientName: 'Emma Wilson',
      shootType: 'Maternity',
      eventDate: '2024-02-10',
      imageUrl: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'Studio Maternity',
      uploadDate: '2024-02-11',
      isWatermarked: true,
      isPinProtected: true
    },
    {
      id: '4',
      projectId: 'PRJ-2024-004',
      clientName: 'TechCorp',
      shootType: 'Corporate',
      eventDate: '2024-03-20',
      imageUrl: 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'Corporate Event',
      uploadDate: '2024-03-21',
      isWatermarked: false,
      isPinProtected: false
    },
    {
      id: '5',
      projectId: 'PRJ-2024-005',
      clientName: 'Arjun Kumar',
      shootType: 'Portrait',
      eventDate: '2024-02-25',
      imageUrl: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'Portrait Session',
      uploadDate: '2024-02-26',
      isWatermarked: true,
      isPinProtected: false
    },
    {
      id: '6',
      projectId: 'PRJ-2024-001',
      clientName: 'Sarah & John',
      shootType: 'Wedding',
      eventDate: '2024-03-15',
      imageUrl: 'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'Reception Dance',
      uploadDate: '2024-03-16',
      isWatermarked: true,
      isPinProtected: true
    }
  ]);

  const shootTypes = ['Wedding', 'Pre-Wedding', 'Maternity', 'Corporate', 'Portrait', 'Events'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const filteredItems = galleryItems.filter(item => {
    const eventDate = new Date(item.eventDate);
    const itemMonth = eventDate.toLocaleString('default', { month: 'long' });
    
    const matchesClient = !filters.clientName || item.clientName.toLowerCase().includes(filters.clientName.toLowerCase());
    const matchesMonth = !filters.month || itemMonth === filters.month;
    const matchesShootType = !filters.shootType || item.shootType === filters.shootType;
    const matchesSearch = !filters.search || 
      item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.clientName.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesClient && matchesMonth && matchesShootType && matchesSearch;
  });

  const handlePreview = (item: GalleryItem) => {
    setPreviewItem(item);
    setShowPreview(true);
  };

  const handleDelete = (itemId: string) => {
    // In real app, delete from backend
    console.log('Delete item:', itemId);
  };

  const handleEdit = (itemId: string) => {
    // In real app, open edit modal
    console.log('Edit item:', itemId);
  };

  const handleUploadNew = () => {
    // Navigate to upload page - for demo, we'll show an alert
    alert('Navigate to upload page');
  };

  const uniqueClients = [...new Set(galleryItems.map(item => item.clientName))];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <Header title="Gallery Management" sidebarCollapsed={sidebarCollapsed} />

        {/* Main Content */}
        <main className="pt-16 p-6">
          {/* Top Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2D2D2D]">Gallery Management</h2>
              <p className="text-gray-600 mt-1">Manage and organize your project media</p>
            </div>
            <button
              onClick={handleUploadNew}
              className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload New
            </button>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Client Filter */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Client Name</label>
                <select
                  value={filters.clientName}
                  onChange={(e) => handleFilterChange('clientName', e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                >
                  <option value="">All Clients</option>
                  {uniqueClients.map(client => (
                    <option key={client} value={client}>{client}</option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Month</label>
                <select
                  value={filters.month}
                  onChange={(e) => handleFilterChange('month', e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                >
                  <option value="">All Months</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              {/* Shoot Type Filter */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Shoot Type</label>
                <select
                  value={filters.shootType}
                  onChange={(e) => handleFilterChange('shootType', e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                >
                  <option value="">All Types</option>
                  {shootTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search by project or client"
                    className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Media Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                {/* Image */}
                <div className="relative aspect-square group">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2">
                      <button
                        onClick={() => handlePreview(item)}
                        className="p-2 bg-white text-[#00BCEB] rounded-full hover:bg-[#00BCEB] hover:text-white transition-colors duration-200"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(item.id)}
                        className="p-2 bg-white text-[#FF6B00] rounded-full hover:bg-[#FF6B00] hover:text-white transition-colors duration-200"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-white text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors duration-200"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="absolute top-2 right-2 flex flex-col space-y-1">
                    {item.isWatermarked && (
                      <span className="px-2 py-1 bg-[#00BCEB] text-white text-xs rounded-full">
                        Watermarked
                      </span>
                    )}
                    {item.isPinProtected && (
                      <span className="px-2 py-1 bg-[#FF6B00] text-white text-xs rounded-full">
                        PIN Protected
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-[#2D2D2D] mb-2 truncate">{item.title}</h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span className="truncate">{item.clientName}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Camera className="h-4 w-4 mr-2" />
                      <span>{item.shootType}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{new Date(item.eventDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={() => window.location.href = `/projects/${item.projectId}`}
                      className="text-[#00BCEB] hover:text-[#00A5CF] text-sm font-medium transition-colors duration-200"
                    >
                      View Project
                    </button>
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-1 text-gray-400 hover:text-[#00BCEB] transition-colors duration-200"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-[#FF6B00] transition-colors duration-200"
                        title="Share"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#2D2D2D] mb-2">No media found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or upload new media</p>
              <button
                onClick={handleUploadNew}
                className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200 mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload New Media
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Preview Modal */}
      {showPreview && previewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-[#2D2D2D]">{previewItem.title}</h3>
                <p className="text-gray-600">{previewItem.clientName} • {previewItem.shootType}</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Image */}
                <div className="flex-1">
                  <img
                    src={previewItem.imageUrl}
                    alt={previewItem.title}
                    className="w-full h-auto rounded-lg"
                  />
                </div>

                {/* Details */}
                <div className="lg:w-80 space-y-4">
                  <div>
                    <h4 className="font-semibold text-[#2D2D2D] mb-2">Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Event Date:</span>
                        <span className="text-[#2D2D2D]">{new Date(previewItem.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Upload Date:</span>
                        <span className="text-[#2D2D2D]">{new Date(previewItem.uploadDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Watermarked:</span>
                        <span className={previewItem.isWatermarked ? 'text-green-600' : 'text-gray-400'}>
                          {previewItem.isWatermarked ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">PIN Protected:</span>
                        <span className={previewItem.isPinProtected ? 'text-green-600' : 'text-gray-400'}>
                          {previewItem.isPinProtected ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => window.location.href = `/projects/${previewItem.projectId}`}
                      className="w-full flex items-center justify-center px-4 py-2 bg-[#00BCEB] text-white rounded-lg font-medium hover:bg-[#00A5CF] transition-colors duration-200"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Project
                    </button>
                    <button className="w-full flex items-center justify-center px-4 py-2 border border-[#FF6B00] text-[#FF6B00] rounded-lg font-medium hover:bg-[#FF6B00] hover:text-white transition-colors duration-200">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </button>
                    <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;