// @ts-ignore - React is needed for JSX runtime despite react-jsx transform
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Grid3X3,
  List,
  Heart,
  Download,
  Eye,
  X,
  FolderPlus,
  Loader2,
  AlertCircle,
  Play,
  ChevronLeft,
  ChevronRight,
  Lock,
  Check,
  Mail,
  Phone,
  Instagram,
  Facebook,
  Camera,
  Shield,
} from 'lucide-react';
import { createFavoritesFolderAPI } from '../api/favoritesAPI';

// -------------------- Interfaces --------------------
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
  isVideo?: boolean;
}

interface FolderItem {
  name: string;
  path: string;
}

interface ApiResponse {
  files: any[];
  folders: FolderItem[];
}

// -------------------- Main Component --------------------
function SharedImages() {
  const { folderPath } = useParams<{ folderPath: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shareId = searchParams.get('sid');
  
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favoritedItems, setFavoritedItems] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [projectName, setProjectName] = useState<string>('default');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  
  // User Permissions
  const [permissions] = useState({
    canDownload: true,
    canViewFullSize: true,
    canShare: false,
    watermarkEnabled: false,
  });
  
  // Hero Image
  const [heroImage, setHeroImage] = useState<string | null>(null);
  
  // PIN Protection
  const [isPinRequired, setIsPinRequired] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Decode the folder path from URL
  const decodedFolderPath = folderPath ? decodeURIComponent(folderPath) : '';

  // Check PIN protection on mount
  useEffect(() => {
    if (shareId) {
      const shareData = localStorage.getItem(`share_${shareId}`);
      if (shareData) {
        try {
          const data = JSON.parse(shareData);
          
          // Check if link is active
          if (data.isActive === false) {
            setError('This share link has been revoked by the owner.');
            setLoading(false);
            return;
          }
          
          // Check if PIN is required
          if (data.pin) {
            setIsPinRequired(true);
            setLoading(false);
          }
        } catch (err) {
          console.error('Failed to parse share data:', err);
        }
      }
    }
  }, [shareId]);

  // Verify PIN
  const handlePinSubmit = () => {
    if (!shareId) return;
    
    const shareData = localStorage.getItem(`share_${shareId}`);
    if (shareData) {
      try {
        const data = JSON.parse(shareData);
        if (data.pin === pinInput) {
          setIsPinRequired(false);
          setPinError('');
          addNotification('Access granted', 'success');
          // Trigger fetch after PIN verification
          if (decodedFolderPath) {
            fetchFolderItems();
          }
        } else {
          setPinError('Incorrect PIN. Please try again.');
          setPinInput('');
        }
      } catch (err) {
        setPinError('Failed to verify PIN');
      }
    }
  };

  useEffect(() => {
    const pathSegments = decodedFolderPath.replace(/^\/+/, '').split('/');
    const galleryIndex = pathSegments.indexOf('gallery');
    let name = '';
    
    if (galleryIndex !== -1 && galleryIndex + 1 < pathSegments.length) {
      name = pathSegments[galleryIndex + 1];
    } else {
      // Extract the last meaningful segment, removing leading slashes
      const cleanPath = decodedFolderPath.replace(/^\/+/, '').replace(/\/+$/, '');
      name = cleanPath.split('/').pop() || cleanPath || 'default';
    }
    
    // Clean up the name: replace underscores and hyphens with spaces, handle multiple spaces
    name = name.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
    
    setProjectName(name || 'Gallery');
  }, [decodedFolderPath]);

  const fetchFolderItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let prefix = decodedFolderPath;
      if (prefix && !prefix.endsWith('/')) {
        prefix += '/';
      }
      if (prefix.startsWith('/')) {
        prefix = prefix.slice(1);
      }

      const foldersResponse = await fetch(
        `https://a9017femoa.execute-api.eu-north-1.amazonaws.com/default/getallimages?prefix=${encodeURIComponent(prefix)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
        }
      );

      if (!foldersResponse.ok) {
        throw new Error(`Failed to fetch folders: ${foldersResponse.statusText}`);
      }

      const foldersData: ApiResponse = await foldersResponse.json();
      const mappedFolders: FolderItem[] = foldersData.folders ? foldersData.folders.map((folder: any) => ({
        name: folder.name,
        path: folder.path,
      })) : [];
      setFolders(mappedFolders);

      const imagesResponse = await fetch(
        `https://a9017femoa.execute-api.eu-north-1.amazonaws.com/default/getallimages?prefix=${encodeURIComponent(prefix)}&recursive=true`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
        }
      );

      if (!imagesResponse.ok) {
        throw new Error(`Failed to fetch images: ${imagesResponse.statusText}`);
      }

      const data: ApiResponse = await imagesResponse.json();

      if (!data || !Array.isArray(data.files)) {
        throw new Error('Unexpected API response format');
      }

      const mappedItems: GalleryItem[] = data.files
        .map((item: any) => {
          if (!item.key || typeof item.key !== 'string' || !item.key.includes('/') || item.key.trim() === '' || !item.key.match(/\.(jpg|jpeg|png|gif|mp4|mov|avi|wmv|mkv)$/i)) {
            return null;
          }
          const keyParts = item.key.split('/');
          const rawTitle = keyParts.pop() || 'Untitled';
          const title = rawTitle.replace(/\.[^/.]+$/, '');
          let eventDate = item.last_modified ? item.last_modified.split('T')[0] : '';

          const dateMatch = title.match(/(\d{4})(\d{2})(\d{2})/);
          if (dateMatch) {
            eventDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
          }

          const isVideo = !!item.key.match(/\.(mp4|mov|avi|wmv|mkv)$/i);

          const folderPath = keyParts.join('/');
          const subfolderName = folderPath.replace(prefix, '').split('/')[0] || 'Main Folder';

          return {
            id: item.key,
            shootType: title.includes('IMG') ? 'Portrait' : title.includes('Snapchat') ? 'Casual' : 'Unknown',
            eventDate,
            imageUrl: item.presigned_url || item.url || 'https://picsum.photos/400/300',
            title: `${subfolderName}: ${title}`,
            uploadDate: item.last_modified ? item.last_modified.split('T')[0] : '',
            isWatermarked: false,
            isPinProtected: false,
            isFavorite: false,
            key: item.key,
            isVideo,
          } as GalleryItem;
        })
        .filter((item): item is GalleryItem => item !== null);

      setItems(mappedItems);
      
      // Set hero image as first image if available
      if (mappedItems.length > 0 && !mappedItems[0].isVideo) {
        setHeroImage(mappedItems[0].imageUrl);
      }
    } catch (err: any) {
      setError(`Failed to load folder items: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [decodedFolderPath]);

  useEffect(() => {
    fetchFolderItems();
    setCurrentPage(1);
  }, [fetchFolderItems]);

  const handleItemFavorite = async (itemId: string) => {
    const isCurrentlyFavorited = favoritedItems.includes(itemId);
    const newFavoritedItems = isCurrentlyFavorited
      ? favoritedItems.filter(id => id !== itemId)
      : [...favoritedItems, itemId];
    setFavoritedItems(newFavoritedItems);

    if (!isCurrentlyFavorited) {
      const item = items.find(item => item.id === itemId);
      if (!item || !item.key) {
        addNotification('Image not found', 'error');
        setFavoritedItems(favoritedItems); // Revert selection
        return;
      }

      try {
        const folderName = 'client%20selection';
        const sourceFolder = decodedFolderPath.replace(/^\/+/, '').replace(/\/+$/, '');

        const result = await createFavoritesFolderAPI({
          folderName,
          imageKeys: [item.key],
          sourceFolder,
        });

        if (result.success) {
          addNotification(`Image added to "${projectName}" folder under client selection`, 'success');
        } else {
          throw new Error('Failed to add image to client selection folder');
        }
      } catch (err: any) {
        addNotification(`Failed to add image to client selection: ${err.message}`, 'error');
        setFavoritedItems(favoritedItems.filter(id => id !== itemId));
      }
    } else {
      addNotification('Image removed from selection', 'info');
    }
  };

  const handleFavoriteAll = async () => {
    if (favoritedItems.length === items.length) {
      setFavoritedItems([]);
      addNotification('All images unselected', 'info');
    } else {
      const newFavoritedItems = items.map(item => item.id);
      setFavoritedItems(newFavoritedItems);

      const imageKeys = items
        .map(item => item.key)
        .filter((key): key is string => !!key && typeof key === 'string' && key.includes('/') && key.trim() !== '');

      if (imageKeys.length === 0) {
        addNotification('No valid images to favorite', 'error');
        setFavoritedItems([]);
        return;
      }

      try {
        const folderName = 'client%20selection';
        const sourceFolder = decodedFolderPath.replace(/^\/+/, '').replace(/\/+$/, '');

        const result = await createFavoritesFolderAPI({
          folderName,
          imageKeys,
          sourceFolder,
        });

        if (result.success) {
          addNotification(`${imageKeys.length} images added to "${projectName}" folder under client selection`, 'success');
        } else {
          throw new Error('Failed to add images to client selection folder');
        }
      } catch (err: any) {
        addNotification(`Failed to add images to client selection: ${err.message}`, 'error');
        setFavoritedItems([]);
      }
    }
  };

  const handleFolderClick = (folderPath: string) => {
    const encodedPath = encodeURIComponent(folderPath);
    navigate(`/shared-images/${encodedPath}`);
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleBackToGallery = () => {
    window.history.back();
  };

  // Try to fetch blob and save — if CORS blocks fetch, fallback to <a> download link.
  const fetchBlobOrDownloadLink = async (url: string, filename: string) => {
    try {
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      return true;
    } catch (err: any) {
      console.warn('Direct fetch failed (possibly CORS). Falling back to <a> download link.', err);
      // Fallback: create temporary <a> tag to trigger download
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank'; // Optional: open in new tab if download doesn't trigger
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addNotification(`Download started for ${filename}`, 'info');
        return true;
      } catch (e) {
        console.error('Fallback download failed', e);
        addNotification(`Download failed: ${err.message}`, 'error');
        return false;
      }
    }
  };

  const handleDownloadSelected = async (downloadAll: boolean = false) => {
    if (!permissions.canDownload) {
      addNotification('Downloads are not permitted in this gallery', 'error');
      return;
    }

    try {
      const itemsToDownload = downloadAll ? items : (favoritedItems.length > 0 
        ? items.filter(item => favoritedItems.includes(item.id))
        : items);

      if (itemsToDownload.length === 0) {
        addNotification('No items to download', 'error');
        return;
      }

      setIsDownloading(true);
      setDownloadProgress({ current: 0, total: itemsToDownload.length });

      let successCount = 0;
      for (let i = 0; i < itemsToDownload.length; i++) {
        const item = itemsToDownload[i];
        const ext = item.isVideo ? 'mp4' : 'jpg';
        const filename = `${item.title}.${ext}`;
        const success = await fetchBlobOrDownloadLink(item.imageUrl, filename);
        if (success) successCount++;
        setDownloadProgress({ current: i + 1, total: itemsToDownload.length });
        // Small delay to prevent browser blocking multiple downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setIsDownloading(false);
      addNotification(`Downloaded ${successCount} of ${itemsToDownload.length} items`, 'success');
    } catch (err: any) {
      setIsDownloading(false);
      console.error('Download error:', err);
      addNotification(
        `Failed to download items: ${err.message.includes('Forbidden') ? 'Permission denied - check presigned URL or contact support' : err.message}`,
        'error'
      );
    }
  };

  const handleDownloadCurrentImage = async () => {
    if (selectedImageIndex !== null) {
      const item = items[selectedImageIndex];
      const ext = item.isVideo ? 'mp4' : 'jpg';
      const filename = `${item.title}.${ext}`;
      const success = await fetchBlobOrDownloadLink(item.imageUrl, filename);
      if (success) {
        addNotification('Item downloaded', 'success');
      }
    }
  };

  const handleViewImage = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImageIndex(null);
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < items.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isImageModalOpen || selectedImageIndex === null) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (selectedImageIndex > 0) {
            setSelectedImageIndex(selectedImageIndex - 1);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (selectedImageIndex < items.length - 1) {
            setSelectedImageIndex(selectedImageIndex + 1);
          }
          break;
        case 'Escape':
          e.preventDefault();
          handleCloseImageModal();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isImageModalOpen, selectedImageIndex, items.length]);

  useEffect(() => {
    if (isImageModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isImageModalOpen]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(items.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // PIN Protection Modal
  if (isPinRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full mb-6">
              <Lock className="h-10 w-10 text-slate-700" />
            </div>
            <h2 className="text-3xl font-light text-gray-900 mb-3 tracking-tight">Download Pin Required</h2>
            <p className="text-gray-600 text-base leading-relaxed">Images in this gallery require a PIN for download. Enter your PIN below</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <input
                type="text"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePinSubmit()}
                placeholder="Enter PIN"
                maxLength={6}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-center text-2xl tracking-[0.3em] font-light text-gray-900 placeholder-gray-400 transition-all"
                autoFocus
              />
              {pinError && (
                <p className="mt-3 text-sm text-red-600 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {pinError}
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setIsPinRequired(false)}
                className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={!pinInput}
                className="flex-1 py-3 px-6 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 font-light">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-light text-gray-900 mb-3">Error Loading Gallery</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Extract gallery title from path
  const getGalleryTitle = () => {
    if (!decodedFolderPath) return projectName;
    
    // Remove leading/trailing slashes and split
    const cleanPath = decodedFolderPath.replace(/^\/+/, '').replace(/\/+$/, '');
    const segments = cleanPath.split('/').filter(Boolean);
    
    // Get the last segment
    let title = segments.length > 0 ? segments[segments.length - 1] : cleanPath;
    
    // Clean up: replace underscores and hyphens with spaces, handle multiple spaces
    title = title.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Capitalize first letter of each word
    title = title.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    return title || projectName;
  };
  
  const galleryTitle = getGalleryTitle();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Header with Image */}
      <header className="relative w-full h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden">
        {/* Hero Image Background */}
        {heroImage ? (
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt={galleryTitle}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00djJoLTJ2LTJoMnptMC00djJoLTJ2LTJoMnptLTQtNHYyaC0ydi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10" />
          </div>
        )}
        
        {/* Navigation Bar */}
        <div className="relative z-10 bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center space-x-4 sm:space-x-6 flex-1 min-w-0">
                <button
                  onClick={handleBackToGallery}
                  className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors group"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-sm font-medium hidden sm:inline">Home</span>
                </button>
                <div className="h-6 w-px bg-white/30" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-light text-white truncate tracking-tight">
                    {galleryTitle.toUpperCase()}
                  </h1>
                  <p className="text-xs sm:text-sm text-white/80 mt-1 hidden sm:block font-light">
                    A curated collection of beautiful photography
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 sm:p-2.5 rounded-lg transition-all backdrop-blur-md ${
                    viewMode === 'grid' 
                      ? 'bg-white/20 text-white shadow-lg' 
                      : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 sm:p-2.5 rounded-lg transition-all backdrop-blur-md ${
                    viewMode === 'list' 
                      ? 'bg-white/20 text-white shadow-lg' 
                      : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                  }`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
            <div className="flex items-end justify-between">
              <div className="text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Camera className="h-5 w-5 text-white/80" />
                  <span className="text-sm font-light text-white/90">Arif Photography</span>
                </div>
                <p className="text-sm sm:text-base text-white/80 font-light max-w-2xl">
                  Professional photography services capturing your special moments
                </p>
              </div>
              {items.length > 0 && (
                <div className="hidden sm:block text-right">
                  <div className="text-3xl sm:text-4xl font-light text-white mb-1">
                    {items.length}
                  </div>
                  <div className="text-sm text-white/80 font-light">
                    {items.length === 1 ? 'Image' : 'Images'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Download Bar with Permissions */}
      {items.length > 0 && (
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                {favoritedItems.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                      <Check className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {favoritedItems.length} image{favoritedItems.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <button
                      onClick={() => setFavoritedItems([])}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors underline"
                    >
                      Clear
                    </button>
                  </>
                )}
                {isDownloading && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 px-3 py-1.5 bg-gray-50 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span>Downloading {downloadProgress.current} of {downloadProgress.total}...</span>
                  </div>
                )}
                {/* Permission Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">
                    {permissions.canDownload ? 'Download Enabled' : 'View Only'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {favoritedItems.length > 0 && permissions.canDownload && (
                  <button
                    onClick={() => handleDownloadSelected(false)}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Selected</span>
                  </button>
                )}
                {permissions.canDownload && (
                  <button
                    onClick={() => handleDownloadSelected(true)}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download All</span>
                  </button>
                )}
                {!permissions.canDownload && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed">
                    <Lock className="h-4 w-4" />
                    <span>Downloads Restricted</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-gray-50/50 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start gap-3 text-gray-700">
            <Heart className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm leading-relaxed text-gray-600">
              Easily save your favorite pictures by clicking the <span className="font-medium">heart icon</span> to select images. They&apos;ll be saved to your &quot;{projectName}&quot; folder in client selection.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {items.length > 0 && (
          <div className="mb-8 flex items-center justify-between">
            <button
              onClick={handleFavoriteAll}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium text-gray-700"
            >
              <Heart className={`h-4 w-4 ${favoritedItems.length === items.length ? 'fill-red-500 text-red-500' : ''}`} />
              <span>
                {favoritedItems.length === items.length ? 'Unselect All' : 'Select All'}
              </span>
            </button>
            <span className="text-sm text-gray-500 font-light">
              {items.length} {items.length === 1 ? 'image' : 'images'}
            </span>
          </div>
        )}

        {folders.length > 0 && (
          <div className="mb-12">
            <h2 className="text-lg font-light text-gray-900 mb-6 tracking-wide">Folders</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <div
                  key={folder.path}
                  onClick={() => handleFolderClick(folder.path)}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <FolderPlus className="h-10 w-10 text-gray-400 group-hover:text-gray-600 group-hover:scale-110 transition-all duration-300" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{folder.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && folders.length === 0 ? (
          <div className="text-center py-24">
            <FolderPlus className="h-16 w-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-light text-gray-900 mb-2">Empty Gallery</h3>
            <p className="text-gray-500">No images or folders here yet.</p>
          </div>
        ) : items.length > 0 ? (
          <div>
            {folders.length > 0 && (
              <h2 className="text-lg font-light text-gray-900 mb-6 tracking-wide">Images & Videos</h2>
            )}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
              : 'space-y-3'
            }>
              {currentItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100/50 ${
                    favoritedItems.includes(item.id) ? 'ring-2 ring-red-500 ring-offset-2' : ''
                  } ${viewMode === 'list' ? 'flex items-center gap-4 p-4' : ''}`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemFavorite(item.id);
                    }}
                    className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all duration-200 hover:scale-110 ${
                      favoritedItems.includes(item.id) 
                        ? 'bg-red-500/90 text-white shadow-lg' 
                        : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white shadow-sm'
                    }`}
                    aria-label={favoritedItems.includes(item.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className="h-4 w-4" fill={favoritedItems.includes(item.id) ? 'currentColor' : 'none'} />
                  </button>
                  <div 
                    className={`relative ${viewMode === 'list' ? 'w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden' : 'aspect-[4/3]'}`}
                    onClick={() => handleViewImage(indexOfFirstItem + index)}
                  >
                    {item.isVideo ? (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                        <video src={item.imageUrl} className="w-full h-full object-cover" muted loop playsInline />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="h-12 w-12 text-white/90 drop-shadow-lg" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Image+Not+Available';
                          addNotification(`Failed to load ${item.title}`, 'error');
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Eye className="h-8 w-8 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  {viewMode === 'list' && (
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{item.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{item.eventDate}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => paginate(i + 1)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === i + 1 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-5 py-3 rounded-xl shadow-2xl max-w-sm flex items-center gap-3 backdrop-blur-md animate-fade-in ${
              notification.type === 'success' 
                ? 'bg-green-500/90 text-white' 
                : notification.type === 'error'
                ? 'bg-red-500/90 text-white'
                : 'bg-gray-900/90 text-white'
            }`}
          >
            {notification.type === 'success' && <Check className="h-5 w-5 flex-shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
            <span className="text-sm font-medium flex-1">{notification.message}</span>
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Image Viewer Modal */}
      {isImageModalOpen && selectedImageIndex !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={handleCloseImageModal}
        >
          <div 
            className="relative w-full h-full max-w-7xl max-h-[100vh] p-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseImageModal}
              className="absolute top-6 right-6 z-20 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all hover:scale-110"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation Buttons */}
            {selectedImageIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all hover:scale-110"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
            )}
            {selectedImageIndex < items.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all hover:scale-110"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            )}

            {/* Image/Video */}
            <div className="flex items-center justify-center h-full w-full">
              {items[selectedImageIndex]?.isVideo ? (
                <video
                  src={items[selectedImageIndex]?.imageUrl}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                  controls
                  autoPlay
                  loop
                  onClick={(e) => e.stopPropagation()}
                  onError={() => addNotification('Failed to load video', 'error')}
                />
              ) : (
                <img
                  src={items[selectedImageIndex]?.imageUrl}
                  alt={items[selectedImageIndex]?.title}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Image+Not+Available';
                    addNotification('Failed to load image', 'error');
                  }}
                />
              )}
            </div>

            {/* Bottom Info Bar */}
            <div className="absolute bottom-6 left-0 right-0 z-20">
              <div className="mx-auto max-w-4xl bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white border border-white/20">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-light truncate mb-1">{items[selectedImageIndex]?.title}</h3>
                    <p className="text-sm opacity-80 font-light">
                      {items[selectedImageIndex]?.eventDate} • Image {selectedImageIndex + 1} of {items.length}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemFavorite(items[selectedImageIndex].id);
                      }}
                      className={`p-3 rounded-full backdrop-blur-md transition-all hover:scale-110 ${
                        favoritedItems.includes(items[selectedImageIndex].id) 
                          ? 'bg-red-500/90 text-white' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <Heart className="h-5 w-5" fill={favoritedItems.includes(items[selectedImageIndex].id) ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadCurrentImage();
                      }}
                      className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all hover:scale-110"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Camera className="h-6 w-6 text-white" />
                <h3 className="text-xl font-light tracking-wide">Arif Photography</h3>
              </div>
              <p className="text-sm text-gray-400 font-light leading-relaxed max-w-xs">
                Capturing life&apos;s most precious moments with professional photography services. 
                Your memories, beautifully preserved.
              </p>
            </div>

            {/* Contact Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Contact</h4>
              <div className="space-y-3">
                <a
                  href="mailto:arifphotographyprimerpro@gmail.com"
                  className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group"
                >
                  <Mail className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-light">arifphotographyprimerpro@gmail.com</span>
                </a>
                <a
                  href="tel:+1234567890"
                  className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group"
                >
                  <Phone className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-light">+1 (234) 567-890</span>
                </a>
              </div>
            </div>

            {/* Social & Links Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Follow Us</h4>
              <div className="flex items-center gap-4">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                </a>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500 font-light">
                  © {new Date().getFullYear()} Arif Photography. All rights reserved.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500 font-light text-center sm:text-left">
                Professional Photography Services
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield className="h-3 w-3" />
                <span className="font-light">Secure Gallery Access</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default SharedImages;