import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Grid3X3,
  List,
  Heart,
  Download,
  Eye,
  Check,
  X,
  FolderPlus,
  Loader2,
  AlertCircle,
  Play,
} from 'lucide-react';
import { createFavoritesFolderAPI, testAPIs } from '../api/favoritesAPI';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [favoritesFolderName, setFavoritesFolderName] = useState('');
  const [isCreatingFavorites, setIsCreatingFavorites] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  // Decode the folder path from URL
  const decodedFolderPath = folderPath ? decodeURIComponent(folderPath) : '';

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

      console.log(`Fetching all images recursively with prefix: '${prefix}'`);

      // Fetch all images recursively (including subfolders)
      const response = await fetch(
        `https://a9017femoa.execute-api.eu-north-1.amazonaws.com/default/getallimages?prefix=${encodeURIComponent(prefix)}&recursive=true`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch items: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();

      if (!data || !Array.isArray(data.files)) {
        throw new Error('Unexpected API response format');
      }

      // Map all images from the folder and its subfolders
      const mappedItems: GalleryItem[] = data.files.map((item: any) => {
        const keyParts = item.key.split('/');
        const rawTitle = keyParts.pop() || 'Untitled';
        const title = rawTitle.replace(/\.[^/.]+$/, '');
        let eventDate = item.last_modified ? item.last_modified.split('T')[0] : '';

        const dateMatch = title.match(/(\d{4})(\d{2})(\d{2})/);
        if (dateMatch) {
          eventDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
        }

        const isVideo = !!item.key.match(/\.(mp4|mov|avi|wmv|mkv)$/i);

        // Determine which subfolder this image belongs to
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
        };
      });

      setItems(mappedItems);
    } catch (err: any) {
      console.error('Error fetching folder items:', err);
      setError(`Failed to load folder items: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [decodedFolderPath]);

  useEffect(() => {
    fetchFolderItems();
  }, [fetchFolderItems]);

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const handleCreateFavoritesFolder = async () => {
    if (!favoritesFolderName.trim() || selectedItems.length === 0) {
      addNotification('Please enter a folder name and select images', 'error');
      return;
    }

    setIsCreatingFavorites(true);
    
    try {
      // Create favorites folder using real API
      console.log('Creating folder with data:', {
        folderName: favoritesFolderName.trim(),
        imageKeys: selectedItems,
        sourceFolder: decodedFolderPath
      });
      
      // Get the actual S3 keys for the selected items
      const selectedImageKeys = items
        .filter(item => selectedItems.includes(item.id))
        .map(item => item.key || item.id); // Use key if available, fallback to id
      
      console.log('=== SELECTION DEBUG INFO ===');
      console.log('All items:', items.map(item => ({ id: item.id, key: item.key, title: item.title })));
      console.log('Selected item IDs:', selectedItems);
      console.log('Selected image keys:', selectedImageKeys);
      console.log('Selected items details:', items.filter(item => selectedItems.includes(item.id)));
      console.log('=== END SELECTION DEBUG ===');
      
      const result = await createFavoritesFolderAPI({
        folderName: favoritesFolderName.trim(),
        imageKeys: selectedImageKeys,
        sourceFolder: decodedFolderPath
      });

      if (result.success) {
        addNotification(`New folder "${favoritesFolderName}" created successfully in parent directory! ${selectedImageKeys.length} images uploaded to the folder.`, 'success');
        
        // Reset state
        setSelectedItems([]);
        setFavoritesFolderName('');
        setShowFavoritesModal(false);
        
        // Navigate back to gallery after successful creation
        setTimeout(() => {
          navigate('/gallery');
        }, 2000);
      } else {
        throw new Error('Failed to create favorites folder');
      }
      
    } catch (err: any) {
      console.error('Error creating favorites folder:', err);
      addNotification(`Failed to create folder and upload images: ${err.message}`, 'error');
    } finally {
      setIsCreatingFavorites(false);
    }
  };

  const addNotification = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleBackToGallery = () => {
    navigate('/gallery');
  };

  const handleDownloadSelected = async () => {
    if (selectedItems.length === 0) {
      addNotification('Please select images to download', 'error');
      return;
    }

    try {
      // Download logic for selected items
      const selectedImages = items.filter(item => selectedItems.includes(item.id));
      
      for (const image of selectedImages) {
        const link = document.createElement('a');
        link.href = image.imageUrl;
        link.download = image.title;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      addNotification(`Downloaded ${selectedImages.length} images`, 'success');
    } catch (err: any) {
      console.error('Error downloading images:', err);
      addNotification('Failed to download images', 'error');
    }
  };

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
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBackToGallery}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Gallery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button and Title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToGallery}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Gallery</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">
                Shared Images - {decodedFolderPath || 'Root Folder'}
              </h1>
            </div>

            {/* View Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={testAPIs}
                className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                Test APIs
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Bar */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-blue-800 font-medium">
                  {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedItems([])}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDownloadSelected}
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setShowFavoritesModal(true)}
                  className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Heart className="h-4 w-4" />
                  <span>Create New Folder</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-blue-800">
            <Heart className="h-5 w-5" />
            <p className="text-sm font-medium">
              Select your favorite images from this folder and all its subfolders. Create a new folder in the parent directory and upload selected images to organize them.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Select All Bar */}
        {items.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Check className="h-4 w-4" />
              <span>
                {selectedItems.length === items.length ? 'Deselect All' : 'Select All'}
              </span>
            </button>
            <span className="text-sm text-gray-500">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Items Grid/List */}
        {items.length === 0 ? (
          <div className="text-center py-12">
            <FolderPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
            <p className="text-gray-500">This folder doesn't contain any images.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
            : 'space-y-2'
          }>
            {items.map((item) => (
              <div
                key={item.id}
                className={`relative group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${
                  selectedItems.includes(item.id) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <button
                    onClick={() => handleItemSelect(item.id)}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedItems.includes(item.id)
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {selectedItems.includes(item.id) && <Check className="h-3 w-3" />}
                  </button>
                </div>

                {/* Image/Video */}
                <div className="aspect-square relative cursor-pointer">
                  {item.isVideo ? (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Play className="h-8 w-8 text-gray-400" />
                    </div>
                  ) : (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2">
                      <button className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
                        <Eye className="h-4 w-4 text-gray-600" />
                      </button>
                      <button className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
                        <Download className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Item Info */}
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.eventDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Favorites Modal */}
      {showFavoritesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Create New Folder
              </h3>
              <p className="text-gray-600 mb-4">
                Create a new folder in the parent directory and upload {selectedItems.length} selected image{selectedItems.length !== 1 ? 's' : ''} to organize your favorites.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={favoritesFolderName}
                  onChange={(e) => setFavoritesFolderName(e.target.value)}
                  placeholder="Enter folder name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowFavoritesModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFavoritesFolder}
                  disabled={!favoritesFolderName.trim() || isCreatingFavorites}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                    favoritesFolderName.trim() && !isCreatingFavorites
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isCreatingFavorites ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                      Creating Folder & Uploading...
                    </>
                  ) : (
                    'Create Folder & Upload Images'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-4 py-3 rounded-lg shadow-lg max-w-sm ${
              notification.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{notification.message}</span>
              <button
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                className="ml-2 text-white hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SharedImages;
