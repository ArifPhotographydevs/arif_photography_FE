
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
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favoritedItems, setFavoritedItems] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);
  const [projectName, setProjectName] = useState<string>('default');

  // Decode the folder path from URL
  const decodedFolderPath = folderPath ? decodeURIComponent(folderPath) : '';
  console.log('Decoded folder path:', decodedFolderPath);

  useEffect(() => {
    // Extract projectName from the URL path (last segment after projects/gallery/)
    const pathSegments = decodedFolderPath.replace(/^\/+/, '').split('/');
    const galleryIndex = pathSegments.indexOf('gallery');
    const name = galleryIndex !== -1 && galleryIndex + 1 < pathSegments.length ? pathSegments[galleryIndex + 1] : decodedFolderPath.split('/').pop() || 'default';
    setProjectName(name);
    console.log('Calculated projectName from URL:', name);
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
      console.log('Final fetch prefix:', prefix);

      // First fetch folders (non-recursive to get immediate subfolders)
      const foldersResponse = await fetch(
        `https://a9017femoa.execute-api.eu-north-1.amazonaws.com/default/getallimages?prefix=${encodeURIComponent(prefix)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
        }
      );

      if (!foldersResponse.ok) {
        throw new Error(`Failed to fetch folders: ${foldersResponse.status} ${foldersResponse.statusText}`);
      }

      const foldersData: ApiResponse = await foldersResponse.json();
      console.log('Raw folders API response:', foldersData);

      // Map folders - handle case where folders array might be empty
      const mappedFolders: FolderItem[] = foldersData.folders ? foldersData.folders.map((folder: any) => ({
        name: folder.name,
        path: folder.path,
      })) : [];

      console.log('Mapped folders:', mappedFolders);
      setFolders(mappedFolders);

      // Then fetch all images recursively (including subfolders)
      const imagesResponse = await fetch(
        `https://a9017femoa.execute-api.eu-north-1.amazonaws.com/default/getallimages?prefix=${encodeURIComponent(prefix)}&recursive=true`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
        }
      );

      if (!imagesResponse.ok) {
        throw new Error(`Failed to fetch images: ${imagesResponse.status} ${imagesResponse.statusText}`);
      }

      const data: ApiResponse = await imagesResponse.json();
      console.log('Raw images API response:', data);

      if (!data || !Array.isArray(data.files)) {
        throw new Error('Unexpected API response format');
      }

      // Filter and map valid items
      const invalidItems: any[] = [];
      const mappedItems: GalleryItem[] = data.files
        .map((item: any) => {
          console.log('Processing item key:', item.key);
          if (!item.key || item.key === null || item.key === undefined || typeof item.key !== 'string' || !item.key.includes('/') || item.key.trim() === '' || !item.key.match(/\.(jpg|jpeg|png|gif|mp4|mov|avi|wmv|mkv)$/i)) {
            invalidItems.push({ ...item, reason: 'Invalid key' });
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
          };
        })
        .filter((item): item is GalleryItem => item !== null);

      console.log('Invalid items filtered out:', invalidItems);
      console.log('Mapped items:', mappedItems);
      if (mappedItems.length === 0) {
        console.warn('No valid items found in API response. Check if images exist in the folder or if API response is malformed.');
        addNotification('No valid images found in this folder.', 'error');
      }
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

  const handleItemFavorite = async (itemId: string) => {
    const isCurrentlyFavorited = favoritedItems.includes(itemId);
    const newFavoritedItems = isCurrentlyFavorited
      ? favoritedItems.filter(id => id !== itemId)
      : [...favoritedItems, itemId];
    setFavoritedItems(newFavoritedItems);

    if (!isCurrentlyFavorited) {
      const item = items.find(item => item.id === itemId);
      if (!item) {
        addNotification('Image not found', 'error');
        return;
      }

      const imageKey = item.key;
      console.log('Favoriting item with key:', { itemId, imageKey });
      if (!imageKey || typeof imageKey !== 'string' || !imageKey.includes('/') || imageKey.trim() === '') {
        console.error('Invalid image key for item:', { itemId, imageKey, item });
        addNotification('Cannot favorite: Invalid image key', 'error');
        setFavoritedItems(favoritedItems.filter(id => id !== itemId));
        return;
      }

      try {
        const folderName = 'client%20selection';
        const sourceFolder = decodedFolderPath.replace(/^\/+/, '').replace(/\/+$/, '');
        const projectNameFromURL = projectName;

        console.log('Copying image to client selection folder:', {
          folderName,
          imageKeys: [imageKey],
          sourceFolder,
          item,
          projectName: projectNameFromURL,
        });

        const result = await createFavoritesFolderAPI({
          folderName,
          imageKeys: [imageKey],
          sourceFolder,
        });

        if (result.success) {
          addNotification(`Image added to "${projectNameFromURL}" folder under client selection`, 'success');
          const clientSelectionPath = `projects/client%20selection/${projectNameFromURL}`;
          navigate(`/shared-images/${encodeURIComponent(clientSelectionPath)}`);
        } else {
          throw new Error('Failed to add image to client selection folder');
        }
      } catch (err: any) {
        console.error('Error adding image to client selection folder:', err);
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
        console.error('No valid image keys found for favoriting all:', { items });
        addNotification('No valid images to favorite', 'error');
        setFavoritedItems([]);
        return;
      }

      try {
        const folderName = 'client%20selection';
        const sourceFolder = decodedFolderPath.replace(/^\/+/, '').replace(/\/+$/, '');
        const projectNameFromURL = projectName;

        console.log('Copying all images to client selection folder:', {
          folderName,
          imageKeys,
          sourceFolder,
          projectName: projectNameFromURL,
        });

        const result = await createFavoritesFolderAPI({
          folderName,
          imageKeys,
          sourceFolder,
        });

        if (result.success) {
          addNotification(`${imageKeys.length} images added to "${projectNameFromURL}" folder under client selection`, 'success');
          const clientSelectionPath = `projects/client%20selection/${projectNameFromURL}`;
          navigate(`/shared-images/${encodeURIComponent(clientSelectionPath)}`);
        } else {
          throw new Error('Failed to add images to client selection folder');
        }
      } catch (err: any) {
        console.error('Error adding images to client selection folder:', err);
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

  const handleDownloadSelected = async () => {
    if (favoritedItems.length === 0) {
      addNotification('Please favorite images to download', 'error');
      return;
    }

    try {
      const favoritedImages = items.filter(item => favoritedItems.includes(item.id));
      
      for (const image of favoritedImages) {
        const link = document.createElement('a');
        link.href = image.imageUrl;
        link.download = image.title;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      addNotification(`Downloaded ${favoritedImages.length} images`, 'success');
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
          <p className="text-gray-500 mb-4">{error}</p>
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
                <span>Back</span>
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

      {/* Favorites Bar */}
      {favoritedItems.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-blue-800 font-medium">
                  {favoritedItems.length} favorite{favoritedItems.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setFavoritedItems([])}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Clear favorites
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
                  onClick={() => {
                    const clientSelectionPath = `projects/client%20selection/${projectName}`;
                    navigate(`/shared-images/${encodeURIComponent(clientSelectionPath)}`);
                  }}
                  className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>View Client Selection</span>
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
              Click the heart icon to mark images as favorites. They will be automatically copied to a "{projectName}" folder under "client selection" in the parent directory.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Favorite All Bar */}
        {items.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={handleFavoriteAll}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Heart className="h-4 w-4" />
              <span>
                {favoritedItems.length === items.length ? 'Unfavorite All' : 'Favorite All'}
              </span>
            </button>
            <span className="text-sm text-gray-500">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Folders Section */}
        {folders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Folders</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <div
                  key={folder.path}
                  onClick={() => handleFolderClick(folder.path)}
                  className="relative group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="aspect-square bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <FolderPlus className="h-12 w-12 text-blue-500" />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 truncate" title={folder.name}>
                      {folder.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate" title={folder.path}>
                      {folder.path}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Images Section */}
        {items.length === 0 && folders.length === 0 ? (
          <div className="text-center py-12">
            <FolderPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
            <p className="text-gray-500">This folder doesn't contain any images or subfolders.</p>
          </div>
        ) : items.length > 0 ? (
          <div>
            {folders.length > 0 && (
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
            )}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
              : 'space-y-2'
            }>
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`relative group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${
                    favoritedItems.includes(item.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  {/* Favorite Heart */}
                  <div className="absolute top-2 left-2 z-10">
                    <button
                      onClick={() => handleItemFavorite(item.id)}
                      className={`p-1 rounded-full transition-colors ${
                        favoritedItems.includes(item.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                      }`}
                    >
                      <Heart className="h-5 w-5" fill={favoritedItems.includes(item.id) ? 'currentColor' : 'none'} />
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
          </div>
        ) : null}
      </div>

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
