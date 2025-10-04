import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favoritedItems, setFavoritedItems] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);
  const [projectName, setProjectName] = useState<string>('default');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Decode the folder path from URL
  const decodedFolderPath = folderPath ? decodeURIComponent(folderPath) : '';

  useEffect(() => {
    const pathSegments = decodedFolderPath.replace(/^\/+/, '').split('/');
    const galleryIndex = pathSegments.indexOf('gallery');
    const name = galleryIndex !== -1 && galleryIndex + 1 < pathSegments.length ? pathSegments[galleryIndex + 1] : decodedFolderPath.split('/').pop() || 'default';
    setProjectName(name);
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
    }
  };

  const handleFavoriteAll = async () => {
    if (favoritedItems.length === items.length) {
      setFavoritedItems([]);
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

  const addNotification = (message: string, type: 'success' | 'error') => {
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
    try {
      const itemsToDownload = downloadAll ? items : (favoritedItems.length > 0 
        ? items.filter(item => favoritedItems.includes(item.id))
        : items);

      if (itemsToDownload.length === 0) {
        addNotification('No items to download', 'error');
        return;
      }

      let successCount = 0;
      for (const item of itemsToDownload) {
        const ext = item.isVideo ? 'mp4' : 'jpg';
        const filename = `${item.title}.${ext}`;
        const success = await fetchBlobOrDownloadLink(item.imageUrl, filename);
        if (success) successCount++;
      }

      addNotification(`Downloaded ${successCount} of ${itemsToDownload.length} items`, 'success');
    } catch (err: any) {
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
      if (!isImageModalOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNextImage();
          break;
        case 'Escape':
          e.preventDefault();
          handleCloseImageModal();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isImageModalOpen]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading folder contents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Folder</h2>
          <p className="text-gray-500 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <button
                onClick={handleBackToGallery}
                className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Back</span>
              </button>
              <div className="h-4 sm:h-6 w-px bg-gray-300 flex-shrink-0" />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {decodedFolderPath ? 
                  (decodedFolderPath.length > 30 ? 
                    `...${decodedFolderPath.slice(-30)}` : 
                    decodedFolderPath
                  ) : 'Root Folder'
                }
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid3X3 className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-4">
                {favoritedItems.length > 0 && (
                  <>
                    <span className="text-blue-800 font-medium text-sm sm:text-base">
                      {favoritedItems.length} selected
                    </span>
                    <button
                      onClick={() => setFavoritedItems([])}
                      className="text-blue-600 hover:text-blue-800 transition-colors text-sm sm:text-base"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                {favoritedItems.length > 0 && (
                  <button
                    onClick={() => handleDownloadSelected(false)}
                    className="flex items-center space-x-2 px-3 py-1.5 sm:py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Selected</span>
                  </button>
                )}
                <button
                  onClick={() => handleDownloadSelected(true)}
                  className="flex items-center space-x-2 px-3 py-1.5 sm:py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  <Download className="h-4 w-4" />
                  <span>Download All</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start space-x-3 text-blue-800">
            <Heart className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm leading-relaxed">
              Tap the heart on images to select favorites. They&apos;ll be saved to your &quot;{projectName}&quot; folder in client selection.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {items.length > 0 && (
          <div className="mb-6 flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <button
              onClick={handleFavoriteAll}
              className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Heart className={`h-5 w-5 ${favoritedItems.length === items.length ? 'fill-current' : ''}`} />
              <span className="font-medium">
                {favoritedItems.length === items.length ? 'Unselect All' : 'Select All'}
              </span>
            </button>
            <span className="text-sm text-gray-500">
              {items.length} items total
            </span>
          </div>
        )}

        {folders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Folders</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <div
                  key={folder.path}
                  onClick={() => handleFolderClick(folder.path)}
                  className="group bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <FolderPlus className="h-12 w-12 text-blue-500 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{folder.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && folders.length === 0 ? (
          <div className="text-center py-12">
            <FolderPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Empty Folder</h3>
            <p className="text-gray-500">No images or folders here yet.</p>
          </div>
        ) : items.length > 0 ? (
          <div>
            {folders.length > 0 && (
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Images & Videos</h2>
            )}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
              : 'space-y-4'
            }>
              {currentItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`group bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition-shadow duration-200 ${
                    favoritedItems.includes(item.id) ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  } ${viewMode === 'list' ? 'flex items-center space-x-4 p-4' : ''}`}
                >
                  <button
                    onClick={() => handleItemFavorite(item.id)}
                    className={`absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 shadow-sm transition-all duration-200 hover:scale-110 ${
                      favoritedItems.includes(item.id) 
                        ? 'text-red-500' 
                        : 'text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <Heart className="h-4 w-4" fill={favoritedItems.includes(item.id) ? 'currentColor' : 'none'} />
                  </button>
                  <div className={`relative cursor-pointer ${viewMode === 'list' ? 'w-32 h-20 flex-shrink-0' : 'aspect-[4/3]'}`}
                    onClick={() => handleViewImage(indexOfFirstItem + index)}>
                    {item.isVideo ? (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                        <video src={item.imageUrl} className="w-full h-full object-cover" muted loop />
                        <Play className="h-8 w-8 text-white absolute" />
                      </div>
                    ) : (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Image+Not+Available';
                          addNotification(`Failed to load ${item.title}`, 'error');
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className={`${viewMode === 'list' ? 'flex-1' : 'p-3'}`}>
                    <h3 className="text-sm font-medium text-gray-900 truncate">{item.title}</h3>
                    <p className="text-xs text-gray-500">{item.eventDate}</p>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => paginate(i + 1)}
                    className={`px-4 py-2 rounded-md ${
                      currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-4 py-3 rounded-lg shadow-lg max-w-sm flex items-center justify-between ${
              notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className="ml-4 text-white hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {isImageModalOpen && selectedImageIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] p-4">
            <button
              onClick={handleCloseImageModal}
              className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
            >
              <X className="h-6 w-6" />
            </button>
            {selectedImageIndex > 0 && (
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
            )}
            {selectedImageIndex < items.length - 1 && (
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            )}
            <div className="flex items-center justify-center h-full">
              {items[selectedImageIndex]?.isVideo ? (
                <video
                  src={items[selectedImageIndex]?.imageUrl}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  controls
                  autoPlay
                  loop
                  onError={() => addNotification('Failed to load video', 'error')}
                />
              ) : (
                <img
                  src={items[selectedImageIndex]?.imageUrl}
                  alt={items[selectedImageIndex]?.title}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Image+Not+Available';
                    addNotification('Failed to load image', 'error');
                  }}
                />
              )}
            </div>
            <div className="absolute bottom-4 left-0 right-0 z-20">
              <div className="mx-auto max-w-2xl bg-black/50 backdrop-blur-md rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold truncate">{items[selectedImageIndex]?.title}</h3>
                    <p className="text-sm opacity-80">
                      {items[selectedImageIndex]?.eventDate} • {selectedImageIndex + 1}/{items.length}
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleItemFavorite(items[selectedImageIndex].id)}
                      className={`p-2 rounded-full ${
                        favoritedItems.includes(items[selectedImageIndex].id) ? 'text-red-400' : 'text-white'
                      } hover:bg-black/30`}
                    >
                      <Heart className="h-5 w-5" fill={favoritedItems.includes(items[selectedImageIndex].id) ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={handleDownloadCurrentImage}
                      className="p-2 rounded-full text-white hover:bg-black/30"
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
    </div>
  );
}

export default SharedImages;