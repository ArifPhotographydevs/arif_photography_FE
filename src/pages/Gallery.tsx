import React, { useState, useEffect, Component, ErrorInfo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  Edit3, 
  Image,
  Calendar,
  User,
  Camera,
  ExternalLink,
  Download,
  Share2,
  Loader2,
  AlertCircle
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
  loadError?: string;
}

// Error Boundary Component
class GalleryErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(_: Error): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error in Gallery component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#2D2D2D] mb-2">Something went wrong</h3>
          <p className="text-gray-500">Please try refreshing the page or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function Gallery() {
  const navigate = useNavigate();
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
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const shootTypes = ['Wedding', 'Pre-Wedding', 'Maternity', 'Corporate', 'Portrait', 'Events', 'Casual', 'Unknown'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch gallery items from API
  useEffect(() => {
    const fetchGalleryItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          'https://a9017femoa.execute-api.eu-north-1.amazonaws.com/default/getallimages',
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Validate response
        if (!data || !Array.isArray(data.files)) {
          throw new Error('Unexpected API response format: Missing or invalid "files" array');
        }

        // Filter out non-image files and map to GalleryItem
        const mappedItems: GalleryItem[] = data.files
          .filter((item: any) => !item.key.startsWith('temp_zips/') && /\.(jpg|jpeg|png|webp)$/i.test(item.key))
          .map((item: any) => {
            const keyParts = item.key.split('/');
            let projectId = 'unknown';
            let clientName = 'Unknown Client';
            let title = item.key.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Untitled';
            let eventDate = item.last_modified.split('T')[0];

            // Extract projectId or clientId from key
            if (item.key.includes('projects/gallery/')) {
              projectId = keyParts.find((part: string, index: number) => 
                keyParts[index - 2] === 'projects' && keyParts[index - 1] === 'gallery'
              ) || 'unknown';
            } else if (item.key.includes('clients/')) {
              projectId = keyParts.find((part: string, index: number) => 
                keyParts[index - 1] === 'clients'
              ) || 'unknown';
              clientName = `Client ${projectId.slice(0, 8)}`;
            }

            // Extract eventDate from filename if possible (e.g., IMG20210712144356)
            if (item.key.includes('IMG') && /\d{8}/.test(title)) {
              const dateMatch = title.match(/(\d{4})(\d{2})(\d{2})/);
              if (dateMatch) {
                eventDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
              }
            }

            return {
              id: `${projectId}-${item.key.split('/').pop()}`,
              projectId,
              clientName,
              shootType: item.key.includes('IMG') ? 'Portrait' : item.key.includes('Snapchat') ? 'Casual' : 'Unknown',
              eventDate,
              imageUrl: `https://s3.ap-northeast-1.wasabisys.com/arif12/${item.key}`,
              title,
              uploadDate: item.last_modified.split('T')[0],
              isWatermarked: false,
              isPinProtected: false
            };
          });

        console.log('Mapped Gallery Items:', mappedItems);
        setGalleryItems(mappedItems);
      } catch (err: any) {
        console.error('Error fetching gallery items:', err);
        setError(`Failed to load gallery items: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryItems();
  }, []);

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
    console.log('Delete item:', itemId);
  };

  const handleEdit = (itemId: string) => {
    console.log('Edit item:', itemId);
  };

  const handleUploadNew = () => {
    navigate('/gallery/upload');
  };

  // Handle image load error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, itemId: string) => {
    if (e.currentTarget) {
      console.error(`Image failed to load for item ${itemId}: ${e.currentTarget.src}`);
      setGalleryItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, loadError: `Failed to load image` } : item
      ));
      e.currentTarget.src = 'https://picsum.photos/400';
    } else {
      console.error(`Image error event has no currentTarget for item ${itemId}`);
      setGalleryItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, loadError: `Failed to load image` } : item
      ));
    }
  };

  const uniqueClients = [...new Set(galleryItems.map(item => item.clientName))];

  return (
    <GalleryErrorBoundary>
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

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 text-[#00BCEB] animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading gallery items...</p>
              </div>
            )}

            {/* Debug Info */}
            {!loading && !error && (
              <div className="mb-6 text-gray-600">
                <p>Found {filteredItems.length} of {galleryItems.length} items</p>
              </div>
            )}

            {/* Media Grid */}
            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Image */}
                    <div className="relative w-full h-64">
                      {item.loadError ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-red-500 text-sm">
                          <p>{item.loadError}</p>
                        </div>
                      ) : (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => handleImageError(e, item.id)}
                        />
                      )}
                      
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
                          onClick={() => navigate(`/projects/${item.projectId}`)}
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
            )}

            {/* Empty State */}
            {!loading && !error && filteredItems.length === 0 && (
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
                    {previewItem.loadError ? (
                      <div className="w-full h-64 flex items-center justify-center bg-gray-100 text-red-500 text-sm">
                        <p>{previewItem.loadError}</p>
                      </div>
                    ) : (
                      <img
                        src={previewItem.imageUrl}
                        alt={previewItem.title}
                        className="w-full h-auto rounded-lg"
                        onError={(e) => handleImageError(e, previewItem.id)}
                      />
                    )}
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
                        onClick={() => navigate(`/projects/${previewItem.projectId}`)}
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
    </GalleryErrorBoundary>
  );
}

export default Gallery;