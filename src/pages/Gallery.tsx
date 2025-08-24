import React, { useState, useEffect, Component, ErrorInfo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  AlertCircle,
  Folder,
  ArrowLeft,
  Grid3X3,
  List,
  Filter,
  SortAsc,
  SortDesc,
  Star,
  Heart,
  ChevronRight,
  Home,
  X,
  Check,
  Upload,
  FolderPlus,
  CheckCircle,
  Copy,
  Mail,
  Link,
  Lock,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Info,
  Settings
} from 'lucide-react';

interface GalleryItem {
  id: string;
  shootType: string;
  eventDate: string;
  imageUrl: string;
  title: string;
  uploadDate: string;
  isWatermarked: boolean;
  isPinProtected: boolean;
  isFavorite?: boolean;
  key?: string;
}

interface FolderItem {
  name: string;
  path: string;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// Error Boundary
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
interface DeleteError {
  Key: string;
  Code?: string;
  Message: string;
}

function Gallery() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.replace('/gallery', '') || '';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // State management
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteErrors, setDeleteErrors] = useState<DeleteError[]>([]);
  
  // Modal states
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    currentImage: GalleryItem | null;
  }>({ isOpen: false, currentImage: null });
  const [shareModal, setShareModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  
  // Filters and sorting
  const [filters, setFilters] = useState({
    month: '',
    shootType: '',
    search: '',
    favorites: false,
    watermarked: false,
    pinProtected: false
  });
  const [sortBy, setSortBy] = useState('uploadDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Upload state
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadSettings, setUploadSettings] = useState({
    clientName: '',
    eventType: '',
    eventDate: '',
    addWatermark: false,
    pinProtect: false,
    pin: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shootTypes = ['Wedding', 'Pre-Wedding', 'Maternity', 'Corporate', 'Portrait', 'Events', 'Casual', 'Unknown'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch gallery items based on current path (prefix)
  useEffect(() => {
    const fetchGalleryItems = async () => {
      setLoading(true);
      setError(null);
      try {
        let prefix = currentPath;
        if (prefix && !prefix.endsWith('/')) {
          prefix += '/';
        }
        if (prefix.startsWith('/')) {
          prefix = prefix.slice(1);
        }

        const response = await fetch(
          `https://a9017femoa.execute-api.eu-north-1.amazonaws.com/default/getallimages?prefix=${encodeURIComponent(prefix)}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch items: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data || !Array.isArray(data.files) || !Array.isArray(data.folders)) {
          throw new Error('Unexpected API response format');
        }

        // Map files to GalleryItem
        const mappedItems: GalleryItem[] = data.files.map((item: any) => {
          const keyParts = item.key.split('/');
          const title = keyParts.pop()?.replace(/\.[^/.]+$/, '') || 'Untitled';
          let eventDate = item.last_modified.split('T')[0];

          // Extract date from filename
          const dateMatch = title.match(/(\d{4})(\d{2})(\d{2})/);
          if (dateMatch) {
            eventDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
          }

          return {
            id: item.key,
            shootType: title.includes('IMG') ? 'Portrait' : title.includes('Snapchat') ? 'Casual' : 'Unknown',
            eventDate,
            imageUrl: item.presigned_url || 'https://picsum.photos/400/300',  // Fallback
            title,
            uploadDate: item.last_modified.split('T'),
            isWatermarked: false,  // Adjust based on logic
            isPinProtected: false,
            isFavorite: false,
            key: item.key
          };
        });

        // Map folders
        const mappedFolders: FolderItem[] = data.folders.map((folder: any) => ({
          name: folder.name,
          path: `/${folder.path.replace(/\/$/, '')}`  // Ensure path starts with '/' for navigation
        }));

        setItems(mappedItems);
        setFolders(mappedFolders);
      } catch (err: any) {
        console.error('Error fetching gallery items:', err);
        setError(`Failed to load gallery items: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryItems();
  }, [currentPath]);  // Refetch when path changes

  // Apply filters and sorting to images
  const filteredImages = items
    .filter(item => {
      const eventDate = new Date(item.eventDate);
      const itemMonth = eventDate.toLocaleString('default', { month: 'long' });
      
      const matchesMonth = !filters.month || itemMonth === filters.month;
      const matchesShootType = !filters.shootType || item.shootType === filters.shootType;
      const matchesSearch = !filters.search || 
        item.title.toLowerCase().includes(filters.search.toLowerCase());
      const matchesFavorites = !filters.favorites || item.isFavorite;
      const matchesWatermarked = !filters.watermarked || item.isWatermarked;
      const matchesPinProtected = !filters.pinProtected || item.isPinProtected;
      
      return matchesMonth && matchesShootType && matchesSearch && 
             matchesFavorites && matchesWatermarked && matchesPinProtected;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'eventDate':
          aValue = new Date(a.eventDate);
          bValue = new Date(b.eventDate);
          break;
        case 'shootType':
          aValue = a.shootType;
          bValue = b.shootType;
          break;
        default:
          aValue = new Date(a.uploadDate);
          bValue = new Date(b.uploadDate);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Generate breadcrumbs
  const getBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Gallery', path: '' }];
    
    let currentBreadcrumbPath = '';
    parts.forEach(part => {
      currentBreadcrumbPath += `/${part}`;
      breadcrumbs.push({ name: part, path: currentBreadcrumbPath });
    });
    
    return breadcrumbs;
  };

  // Event handlers
  const handleFilterChange = (filterType: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const handleFolderClick = (path: string) => {
    navigate(`/gallery${path}`);
  };

  const handleBack = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const parentPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '';
    navigate(`/gallery${parentPath}`);
  };

  const handleImageClick = (item: GalleryItem) => {
    setPreviewModal({ isOpen: true, currentImage: item });
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = () => {
    const allIds = filteredImages.map(item => item.id);
    setSelectedItems(allIds);
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  const handleDownload = (items: GalleryItem[]) => {
    items.forEach(item => {
      const link = document.createElement('a');
      link.href = item.imageUrl;
      link.download = `${item.title}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleBulkDownload = () => {
    const itemsToDownload = filteredImages.filter(item => selectedItems.includes(item.id));
    handleDownload(itemsToDownload);
  };

  const handleShare = () => {
    setShareModal(true);
  };

  const handleToggleFavorite = (item: GalleryItem) => {
    setItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i
    ));
  };

  const handleDeleteImages = async (itemIds: string[]) => {
  if (itemIds.length === 0) {
    setError('No items selected for deletion');
    return;
  }

  const itemsToDelete = items.filter(item => itemIds.includes(item.id));
  const confirmMessage = itemIds.length === 1 
    ? `Are you sure you want to delete "${itemsToDelete[0]?.title}"?`
    : `Are you sure you want to delete ${itemIds.length} image(s)?`;

  if (!window.confirm(confirmMessage)) return;

  try {
    setDeleteLoading(itemIds);
    setError(null);
    setDeleteErrors([]);

    const itemsToDeleteLog = itemsToDelete.map(item => ({ id: item.id, key: item.key }));
    console.log('Items to delete:', itemsToDeleteLog);

    const keys = itemsToDelete
      .map(item => item.key)
      .filter((key): key is string => typeof key === 'string' && key.trim() !== '');

    console.log('Extracted keys:', keys);

    if (keys.length === 0) {
      throw new Error('No valid keys found for deletion');
    }

    console.log('Sending delete request with keys:', keys);

    const response = await fetch(
      'https://9qvci31498.execute-api.eu-north-1.amazonaws.com/default/deleteimage',
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keys }) // Payload formatted as { "keys": ["key1", "key2", ...] }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delete request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Delete operation failed');
    }

    const deletedKeys = result.deleted || [];
    const errors: DeleteError[] = result.errors || [];
    const deletedItems = itemsToDelete.filter(item => deletedKeys.includes(item.key));

    setItems(prev => prev.filter(item => !deletedItems.some(d => d.id === item.id)));
    setSelectedItems(prev => prev.filter(id => !deletedItems.some(d => d.id === id)));

    if (errors.length > 0) {
      setDeleteErrors(errors);
      setError(`Partially completed: ${deletedKeys.length} deleted, ${errors.length} failed. See details below.`);
      console.warn('Delete errors:', errors);
    } else {
      console.log(`Successfully deleted ${deletedKeys.length} image(s)`);
    }

  } catch (err: any) {
    console.error('Error deleting images:', err);
    setError(`Failed to delete images: ${err.message}`);
  } finally {
    setDeleteLoading([]);
  }
};

  const handleDelete = (itemId: string) => {
    handleDeleteImages([itemId]);
  };

  const handleBulkDelete = () => {
    handleDeleteImages(selectedItems);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!e.currentTarget.src.includes('picsum.photos')) {
      console.error(`Image failed to load: ${e.currentTarget.src}`);
      e.currentTarget.src = 'https://picsum.photos/400/300';
    }
  };

  // Upload handlers (integrated with your upload Lambda)
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const newFiles: UploadFile[] = Array.from(selectedFiles)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: 'pending'
      }));
    
    setUploadFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const startUpload = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending' || f.status === 'error');
    
    try {
      // Call your upload Lambda to get presigned URLs
      const response = await fetch(
        'https://your-upload-lambda-url',  // Replace with your upload Lambda endpoint
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: 'some_project_id',  // Add real values
            client_name: uploadSettings.clientName,
            event_type: uploadSettings.eventType,
            event_date: uploadSettings.eventDate,
            uploadConfig: {
              files: pendingFiles.map(f => f.file.name),
              fileTypes: pendingFiles.map(f => f.file.type),
              settings: {
                addWatermark: uploadSettings.addWatermark,
                pinProtect: uploadSettings.pinProtect,
                pin: uploadSettings.pin
              }
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get presigned URLs');
      }

      const data = await response.json();
      const presignedUrls = data.presignedUrls;

      // Upload each file using presigned URLs
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        const url = presignedUrls[i];

        setUploadFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'uploading' } : f
        ));

        await fetch(url, {
          method: 'PUT',
          body: file.file,
          headers: { 'Content-Type': file.file.type }
        });

        setUploadFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f
        ));
      }
    } catch (error) {
      console.error('Upload error:', error);
      // Set error status for files
    }
  };

  return (
    <GalleryErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        
        <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <Header title="Gallery Management" sidebarCollapsed={sidebarCollapsed} />
          
          <main className="pt-16 p-6">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center mb-2">
                  {currentPath && (
                    <button 
                      onClick={handleBack} 
                      className="flex items-center text-[#00BCEB] hover:text-[#00A5CF] mr-4 transition-colors duration-200"
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Back
                    </button>
                  )}
                  <h2 className="text-2xl font-bold text-[#2D2D2D]">Gallery Management</h2>
                </div>
                
                {/* Breadcrumbs */}
                <nav className="flex items-center space-x-2 text-sm text-gray-600">
                  {getBreadcrumbs().map((crumb, index) => (
                    <React.Fragment key={crumb.path}>
                      {index > 0 && <ChevronRight className="w-4 h-4" />}
                      <button
                        onClick={() => navigate(`/gallery${crumb.path}`)}
                        className={`hover:text-[#00BCEB] transition-colors duration-200 ${
                          index === getBreadcrumbs().length - 1 ? 'font-medium text-[#2D2D2D]' : ''
                        }`}
                      >
                        {index === 0 ? <Home className="w-4 h-4" /> : crumb.name}
                      </button>
                    </React.Fragment>
                  ))}
                </nav>
              </div>
              
{/*               <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setUploadModal(true)}
                  className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload New
                </button>
              </div> */}
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search images..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-transparent w-64"
                    />
                  </div>
                  
                  {/* Filters Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center px-3 py-2 border rounded-lg transition-colors duration-200 ${
                      showFilters 
                        ? 'border-[#00BCEB] text-[#00BCEB] bg-[#00BCEB]/5' 
                        : 'border-gray-200 text-gray-600 hover:border-[#00BCEB] hover:text-[#00BCEB]'
                    }`}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </button>
                  
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-transparent"
                  >
                    <option value="uploadDate">Upload Date</option>
                    <option value="eventDate">Event Date</option>
                    <option value="title">Name</option>
                    <option value="shootType">Shoot Type</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 border border-gray-200 rounded-lg hover:border-[#00BCEB] hover:text-[#00BCEB] transition-colors duration-200"
                  >
                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Selection Info */}
                  {selectedItems.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {selectedItems.length} selected
                      </span>
                      <button
                        onClick={handleBulkDownload}
                        className="px-3 py-1.5 bg-[#00BCEB] text-white rounded-lg hover:bg-[#00A5CF] transition-colors duration-200 text-sm"
                      >
                        <Download className="w-4 h-4 inline mr-1" />
                        Download
                      </button>
                      <button
                        onClick={handleShare}
                        className="px-3 py-1.5 bg-[#FF6B00] text-white rounded-lg hover:bg-[#e55a00] transition-colors duration-200 text-sm"
                      >
                        <Share2 className="w-4 h-4 inline mr-1" />
                        Share
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
                      >
                        <Trash2 className="w-4 h-4 inline mr-1" />
                        Delete
                      </button>
                      <button
                        onClick={handleClearSelection}
                        className="p-1.5 text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* View Mode */}
                  <div className="flex border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-[#00BCEB] text-white' : 'text-gray-600 hover:text-[#00BCEB]'} transition-colors duration-200`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-[#00BCEB] text-white' : 'text-gray-600 hover:text-[#00BCEB]'} transition-colors duration-200 border-l border-gray-200`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <select
                    value={filters.shootType}
                    onChange={(e) => handleFilterChange('shootType', e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-transparent"
                  >
                    <option value="">All Shoot Types</option>
                    {shootTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  
                  <select
                    value={filters.month}
                    onChange={(e) => handleFilterChange('month', e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-transparent"
                  >
                    <option value="">All Months</option>
                    {months.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.favorites}
                        onChange={(e) => handleFilterChange('favorites', e.target.checked)}
                        className="mr-2"
                      />
                      <Star className="w-4 h-4 mr-1" />
                      Favorites Only
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.watermarked}
                        onChange={(e) => handleFilterChange('watermarked', e.target.checked)}
                        className="mr-2"
                      />
                      Watermarked
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Loading/Error States */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 text-[#00BCEB] animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading gallery...</p>
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-8">
                {/* Folders Section */}
                {folders.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[#2D2D2D]">Folders</h3>
                      <span className="text-sm text-gray-500">{folders.length} folder(s)</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {folders.map((folder) => (
                        <div 
                          key={folder.path} 
                          onClick={() => handleFolderClick(folder.path)}
                          className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
                        >
                          <div className="flex items-center mb-3">
                            <Folder className="h-8 w-8 text-[#00BCEB] mr-3 group-hover:scale-110 transition-transform duration-200" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-[#2D2D2D] truncate">{folder.name}</h4>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Images Section */}
                {filteredImages.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[#2D2D2D]">
                        Images
                        {selectedItems.length > 0 && (
                          <button
                            onClick={selectedItems.length === filteredImages.length ? handleClearSelection : handleSelectAll}
                            className="ml-3 text-sm text-[#00BCEB] hover:text-[#00A5CF]"
                          >
                            {selectedItems.length === filteredImages.length ? 'Deselect All' : 'Select All'}
                          </button>
                        )}
                      </h3>
                      <span className="text-sm text-gray-500">{filteredImages.length} image(s)</span>
                    </div>
                    
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredImages.map((item) => (
                          <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group">
                            <div className="relative">
                              <div className="aspect-square overflow-hidden">
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
                                  onError={handleImageError}
                                  onClick={() => handleImageClick(item)}
                                />
                              </div>
                              
                              {/* Overlay */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2">
                                  <button 
                                    onClick={(e) => {e.stopPropagation(); handleImageClick(item);}} 
                                    className="p-2 bg-white text-[#00BCEB] rounded-full hover:bg-[#00BCEB] hover:text-white transition-colors duration-200" 
                                    title="Preview"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => {e.stopPropagation(); handleDownload([item]);}} 
                                    className="p-2 bg-white text-[#FF6B00] rounded-full hover:bg-[#FF6B00] hover:text-white transition-colors duration-200" 
                                    title="Download"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => {e.stopPropagation(); handleDelete(item.id);}} 
                                    className="p-2 bg-white text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors duration-200" 
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Selection Checkbox */}
                              <div className="absolute top-2 left-2">
                                <input
                                  type="checkbox"
                                  checked={selectedItems.includes(item.id)}
                                  onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                  className="w-5 h-5 text-[#00BCEB] bg-white border-gray-300 rounded focus:ring-[#00BCEB] focus:ring-2"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              
                              {/* Badges */}
                              <div className="absolute top-2 right-2 flex flex-col space-y-1">
                                {item.isFavorite && (
                                  <button 
                                    onClick={(e) => {e.stopPropagation(); handleToggleFavorite(item);}}
                                    className="p-1 bg-yellow-500 text-white rounded-full"
                                  >
                                    <Star className="w-3 h-3 fill-current" />
                                  </button>
                                )}
                                {item.isWatermarked && <span className="px-2 py-1 bg-[#00BCEB] text-white text-xs rounded-full">W</span>}
                                {item.isPinProtected && <span className="px-2 py-1 bg-[#FF6B00] text-white text-xs rounded-full">P</span>}
                              </div>
                            </div>
                            
                            <div className="p-4">
                              <h4 className="font-medium text-[#2D2D2D] mb-2 truncate">{item.title}</h4>
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Camera className="h-3 w-3 mr-2" />
                                  <span>{item.shootType}</span>
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-2" />
                                  <span>{new Date(item.eventDate).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="divide-y divide-gray-100">
                          {filteredImages.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                              <div className="flex items-center space-x-4">
                                <input
                                  type="checkbox"
                                  checked={selectedItems.includes(item.id)}
                                  onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                  className="w-4 h-4 text-[#00BCEB] bg-white border-gray-300 rounded focus:ring-[#00BCEB] focus:ring-2"
                                />
                                <div className="w-16 h-16 rounded-lg overflow-hidden">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onError={handleImageError}
                                    onClick={() => handleImageClick(item)}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-[#2D2D2D] truncate">{item.title}</h4>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                    <span>{item.shootType}</span>
                                    <span>{new Date(item.eventDate).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {item.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                                  {item.isWatermarked && <span className="px-2 py-1 bg-[#00BCEB] text-white text-xs rounded-full">W</span>}
                                  {item.isPinProtected && <span className="px-2 py-1 bg-[#FF6B00] text-white text-xs rounded-full">P</span>}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button 
                                    onClick={() => handleImageClick(item)}
                                    className="p-2 text-gray-400 hover:text-[#00BCEB] transition-colors duration-200" 
                                    title="Preview"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDownload([item])}
                                    className="p-2 text-gray-400 hover:text-[#FF6B00] transition-colors duration-200" 
                                    title="Download"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200" 
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && folders.length === 0 && filteredImages.length === 0 && (
              <div className="text-center py-12">
                <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#2D2D2D] mb-2">No folders or images found</h3>
                <p className="text-gray-500 mb-4">Upload some images or adjust your filters</p>
                <button 
                  onClick={() => setUploadModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Images
                </button>
              </div>
            )}
          </main>
        </div>

        {/* Image Preview Modal */}
        {previewModal.isOpen && previewModal.currentImage && (
          <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              <button
                onClick={() => setPreviewModal({ isOpen: false, currentImage: null })}
                className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center justify-center w-full h-full p-8">
                <img
                  src={previewModal.currentImage.imageUrl}
                  alt={previewModal.currentImage.title}
                  className="max-w-full max-h-full object-contain"
                  onError={handleImageError}
                />
              </div>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-black bg-opacity-50 rounded-full px-4 py-2">
                <button
                  onClick={() => handleToggleFavorite(previewModal.currentImage!)}
                  className="p-2 text-white hover:text-yellow-500 transition-colors duration-200"
                  title="Toggle Favorite"
                >
                  <Heart className={`h-5 w-5 ${previewModal.currentImage.isFavorite ? 'fill-current text-yellow-500' : ''}`} />
                </button>
                
                <button
                  onClick={() => handleDownload([previewModal.currentImage!])}
                  className="p-2 text-white hover:text-[#00BCEB] transition-colors duration-200"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
                
                <button
                  onClick={handleShare}
                  className="p-2 text-white hover:text-[#00BCEB] transition-colors duration-200"
                  title="Share"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
                {previewModal.currentImage.title}
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {shareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-[#2D2D2D]">Share Photos</h2>
                <button
                  onClick={() => setShareModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-[#2D2D2D] mb-2">Selected Photos</h3>
                  <p className="text-sm text-gray-600">
                    {selectedItems.length > 0 ? `${selectedItems.length} photo(s) selected` : 'No photos selected'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Share Link</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value="https://your-gallery.com/shared/abc123"
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                    <button className="px-3 py-2 bg-[#00BCEB] text-white rounded-lg hover:bg-[#00A5CF] transition-colors duration-200">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="email"
                      placeholder="client@example.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-transparent"
                    />
                    <button className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#e55a00] transition-colors duration-200">
                      Send
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Allow Download</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Password Protected</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShareModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShareModal(false)}
                  className="px-4 py-2 bg-[#00BCEB] text-white rounded-lg hover:bg-[#00A5CF] transition-colors duration-200"
                >
                  Create Share Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal (Integrated with your upload Lambda) */}
        {uploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-[#2D2D2D]">Upload Photos</h2>
                <button
                  onClick={() => {
                    setUploadModal(false);
                    setUploadFiles([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                {/* Upload Form Fields */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-[#2D2D2D]">Upload Details</h3>
                  
                  <input
                    type="text"
                    placeholder="Client Name"
                    value={uploadSettings.clientName}
                    onChange={(e) => setUploadSettings(prev => ({ ...prev, clientName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  
                  <input
                    type="text"
                    placeholder="Event Type"
                    value={uploadSettings.eventType}
                    onChange={(e) => setUploadSettings(prev => ({ ...prev, eventType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  
                  <input
                    type="date"
                    value={uploadSettings.eventDate}
                    onChange={(e) => setUploadSettings(prev => ({ ...prev, eventDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  
                  {/* Upload Area and other fields as before */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                    className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors duration-200 ${
                      dragOver ? 'border-[#00BCEB] bg-[#00BCEB]/5' : 'border-gray-300 hover:border-[#00BCEB]'
                    }`}
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Drop images here or click to browse
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Supports JPG, PNG, WEBP files up to 10MB each
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-[#00BCEB] text-white rounded-lg hover:bg-[#00A5CF] transition-colors duration-200"
                    >
                      Browse Files
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e.target.files)}
                      className="hidden"
                    />
                  </div>

                  {/* Settings */}
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={uploadSettings.addWatermark}
                        onChange={(e) => setUploadSettings(prev => ({ ...prev, addWatermark: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Add Watermark</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={uploadSettings.pinProtect}
                        onChange={(e) => setUploadSettings(prev => ({ ...prev, pinProtect: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">PIN Protect</span>
                    </label>
                  </div>

                  {uploadSettings.pinProtect && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PIN</label>
                      <input
                        type="password"
                        value={uploadSettings.pin}
                        onChange={(e) => setUploadSettings(prev => ({ ...prev, pin: e.target.value }))}
                        placeholder="Enter 4-digit PIN"
                        maxLength={4}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Footer with Start Upload button calling startUpload */}
              <div className="flex justify-between items-center p-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {uploadFiles.length > 0 && (
                    <span>{uploadFiles.filter(f => f.status === 'completed').length} of {uploadFiles.length} uploaded</span>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setUploadModal(false);
                      setUploadFiles([]);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  
                  {uploadFiles.length > 0 && uploadFiles.some(f => f.status === 'pending' || f.status === 'error') && (
                    <button
                      onClick={startUpload}
                      className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#e55a00] transition-colors duration-200"
                    >
                      Start Upload
                    </button>
                  )}
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
