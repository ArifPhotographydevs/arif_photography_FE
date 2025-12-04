// @ts-ignore - React is needed for JSX runtime despite react-jsx transform
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { downloadFiles } from '../api/downloadAPI';
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
  ChevronDown,
  Lock,
  Check,
  Mail,
  Phone,
  Instagram,
  Facebook,
  Camera,
} from 'lucide-react';
import { createFavoritesFolderAPI } from '../api/favoritesAPI';

// API endpoint for share link access
const SHARE_API_ACCESS = 'https://t5g7mczss8.execute-api.eu-north-1.amazonaws.com/default/SharedLinkAccess';

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
  const [downloadSelectedItems, setDownloadSelectedItems] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [projectName, setProjectName] = useState<string>('default');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  // Download flow modal
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadStep, setDownloadStep] = useState<1 | 3>(1);
  const [emailInput, setEmailInput] = useState('');
  const [downloadInlineMsg, setDownloadInlineMsg] = useState<string>('');
  const [isModalProcessing, setIsModalProcessing] = useState(false);
  const [modalProcessingAction, setModalProcessingAction] = useState<null | 'selected' | 'all'>(null);
  

  // User Permissions
  const [permissions] = useState({
    canDownload: true,
    canViewFullSize: true,
    canShare: false,
    watermarkEnabled: false,
  });

  // Hero Image
  const [heroImage, setHeroImage] = useState<string | null>(null);

  // PIN Protection & Access Control
  const [isPinRequired, setIsPinRequired] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Decode the folder path from URL
  const decodedFolderPath = folderPath ? decodeURIComponent(folderPath) : '';

  // Check share link status and PIN requirement on mount
  useEffect(() => {
    const checkShareLinkAccess = async () => {
      if (!shareId) {
        setIsCheckingAccess(false);
        setHasAccess(true); // Allow access if no shareId (direct access)
        return;
      }

      setIsCheckingAccess(true);
      try {
        // Check share link status from server
        const res = await fetch(SHARE_API_ACCESS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
          body: JSON.stringify({
            action: 'get_share_link_status',
            sharedId: shareId,
          }),
        });

        const txt = await res.text();
        let data: any = null;
        try {
          data = txt ? JSON.parse(txt) : null;
        } catch {
          data = null;
        }

        if (!res.ok || !data || data.success === false) {
          // Access denied
          setIsAccessDenied(true);
          setIsCheckingAccess(false);
          setLoading(false);
          return;
        }

        const link = (data as any).shareLink;
        if (!link || link.isActive === false) {
          // Link is inactive/revoked
          setIsAccessDenied(true);
          setIsCheckingAccess(false);
          setLoading(false);
          return;
        }

        // Check if PIN is required
        if (link.pin || link.isPinProtected) {
          setIsPinRequired(true);
          setIsCheckingAccess(false);
          setLoading(false);
        } else {
          // No PIN required, grant access
          setHasAccess(true);
          setIsCheckingAccess(false);
        }
      } catch (err: any) {
        console.error('Failed to check share link access:', err);
        setIsAccessDenied(true);
        setIsCheckingAccess(false);
        setLoading(false);
      }
    };

    checkShareLinkAccess();
  }, [shareId]);

  // Verify PIN with server
  const handlePinSubmit = async () => {
    if (!shareId || !pinInput || isVerifyingPin) return;

    setPinError('');
    setIsVerifyingPin(true);
    try {
      const res = await fetch(SHARE_API_ACCESS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({
          action: 'verify_pin',
          sharedId: shareId,
          pin: pinInput,
        }),
      });

      const txt = await res.text();
      let data: any = null;
      try {
        data = txt ? JSON.parse(txt) : null;
      } catch {
        data = null;
      }

      if (!res.ok || !data || data.success === false) {
        const msg = (data && data.message) ? data.message : 'Incorrect PIN. Please try again.';
        setPinError(msg);
        setPinInput('');
        setIsVerifyingPin(false);
        return;
      }

      // PIN verified successfully
      setIsPinRequired(false);
      setPinError('');
      setHasAccess(true);
      setIsVerifyingPin(false);
      addNotification('Access granted', 'success');
      
      // Trigger fetch after PIN verification
      if (decodedFolderPath) {
        fetchFolderItems();
      }
    } catch (err: any) {
      setPinError('Failed to verify PIN. Please try again.');
      setPinInput('');
      setIsVerifyingPin(false);
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
    // Only fetch folder items if we have access and are not checking access
    if (hasAccess && !isCheckingAccess && !isPinRequired && !isAccessDenied) {
      fetchFolderItems();
      setCurrentPage(1);
    }
  }, [hasAccess, isCheckingAccess, isPinRequired, isAccessDenied, fetchFolderItems]);

  // Preload initial images and warm Cache API for same-origin only (silent, no UI state)
  useEffect(() => {
    if (items.length === 0) return;
    const preloadCount = Math.min(12, items.length);
    const toPreload = items.slice(0, preloadCount).map(i => i.imageUrl);

    // Best-effort Cache API warm-up for same-origin URLs only (avoid CORS console noise)
    (async () => {
      try {
        if (!('caches' in window)) return;
        const cache = await caches.open('apfe-image-cache');
        const sameOrigin = toPreload.filter((u) => {
          try { return new URL(u, window.location.href).origin === window.location.origin; } catch { return false; }
        });
        await Promise.all(sameOrigin.map(async (url) => {
          try { await cache.add(url); } catch {}
        }));
      } catch {}
    })();

    const imgs: HTMLImageElement[] = [];
    toPreload.forEach((src) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      imgs.push(img);
    });

    return () => {
      imgs.forEach((im) => { im.onload = null; im.onerror = null; });
    };
  }, [items]);

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

  // Download-only selection (separate from favorites)
  const handleToggleDownloadSelect = (itemId: string) => {
    setDownloadSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleDownloadSelectAll = () => {
    if (downloadSelectedItems.length === items.length) {
      setDownloadSelectedItems([]);
      addNotification('All images unselected from download', 'info');
    } else {
      const allIds = items.map(i => i.id);
      setDownloadSelectedItems(allIds);
      addNotification('All images selected for download', 'success');
    }
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

  // Quick download from toolbar: download selected-for-download, else all
  const fetchAllImages = async (prefix: string): Promise<GalleryItem[]> => {
    try {
      const response = await fetch(
        `https://a9017femoa.execute-api.eu-north-1.amazonaws.com/default/getallimages?prefix=${encodeURIComponent(prefix)}&recursive=true`,
        {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors',
          credentials: 'include' // Include credentials for CORS
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to fetch all images: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      if (!data || !Array.isArray(data.files)) {
        throw new Error('Unexpected API response format');
      }

      return data.files
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
            imageUrl: item.presigned_url || item.url,
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
    } catch (error) {
      console.error('Error fetching all images:', error);
      throw error;
    }
  };

  const handleQuickDownload = async () => {
    if (!permissions.canDownload) {
      addNotification('Downloads are not permitted in this gallery', 'error');
      return;
    }
    
    try {
      // Show email input dialog first
      const email = prompt('Please enter your email to receive the download link:');
      if (!email) {
        addNotification('Download cancelled', 'info');
        return;
      }

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        addNotification('Please enter a valid email address', 'error');
        return;
      }

      setIsDownloading(true);
      addNotification('Preparing your download, please wait...', 'info');
      
      // Get the current prefix for the API call
      let prefix = decodedFolderPath;
      if (prefix && !prefix.endsWith('/')) {
        prefix += '/';
      }
      if (prefix.startsWith('/')) {
        prefix = prefix.slice(1);
      }
      
      // Fetch all images (including paginated ones)
      addNotification('Gathering all images...', 'info');
      const allImages = await fetchAllImages(prefix);
      
      if (allImages.length === 0) {
        addNotification('No images found to download', 'info');
        return;
      }
      
      // Extract file keys from the images
      const fileKeys = allImages.map(item => item.key).filter(Boolean) as string[];
      
      // Update progress
      setDownloadProgress({ current: 1, total: 3 });
      
      // Call the Lambda function
      addNotification('Creating your download package...', 'info');
      
      try {
        // Call the Lambda function
        const response = await fetch('https://lxdcf2aagf.execute-api.eu-north-1.amazonaws.com/default/downloadimage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileKeys })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Download failed: ${error}`);
        }

        // Get the zip file as blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `arif-photography-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // Send email confirmation
        try {
          await sendDownloadEmail(email, allImages.length, allImages.length);
          addNotification('Download complete! Check your email for confirmation.', 'success');
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          addNotification('Download complete, but failed to send confirmation email', 'info');
        }
        
      } catch (error: any) {
        console.error('Download error:', error);
        addNotification(`Download failed: ${error.message}`, 'error');
      }
    } catch (error: any) {
      console.error('Error preparing download:', error);
      addNotification(`Error: ${error.message}`, 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Download file using fetch and createObjectURL
  const downloadImage = async (url: string, filename: string): Promise<boolean> => {
    try {
      // Fetch the file
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }

      // Get the file as a blob
      const blob = await response.blob();
      
      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a hidden iframe for the download
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Set iframe content to a page that triggers the download
      iframe.srcdoc = `
        <!DOCTYPE html>
        <html>
          <head>
            <script>
              // This script runs inside the iframe
              window.onload = function() {
                const a = document.createElement('a');
                a.href = '${blobUrl}';
                a.download = '${filename || 'download.jpg'}';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => window.parent.postMessage('downloadComplete', '*'), 100);
              };
            </script>
          </head>
          <body></body>
        </html>
      `;
      
      // Clean up after download starts
      const cleanup = () => {
        try {
          window.URL.revokeObjectURL(blobUrl);
          // Check if iframe is still in the document before trying to remove it
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        } catch (error) {
          console.warn('Cleanup error:', error);
        }
      };
      
      // Set up message listener for cleanup
      const messageHandler = (e: MessageEvent) => {
        if (e.data === 'downloadComplete') {
          cleanup();
          window.removeEventListener('message', messageHandler);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Set timeout as fallback cleanup
      const cleanupTimer = setTimeout(() => {
        cleanup();
        window.removeEventListener('message', messageHandler);
      }, 5000);
      
      // Clean up the timeout when component unmounts
      return () => {
        clearTimeout(cleanupTimer);
        window.removeEventListener('message', messageHandler);
        cleanup();
      };
      
      return true;
  } catch (error: any) {
    console.error('Download error:', error);
    addNotification(`Download failed: ${error.message}`, 'error');
    return false;
  }
};
  // Helper function to fetch with local Vite proxy
  const fetchWithCorsProxy = async (url: string) => {
    try {
      // Remove any existing proxy prefix if present
      const cleanUrl = url.replace(/^\/api\/proxy/, '');
      
      // Create a URL object to parse the URL
      let urlObj: URL;
      try {
        urlObj = new URL(cleanUrl);
      } catch (e) {
        // If URL is relative, prepend the origin
        urlObj = new URL(cleanUrl, window.location.origin);
      }
      
      // Create the proxy URL
      const proxyUrl = `/api/proxy${urlObj.pathname}${urlObj.search}`;
      
      console.log('Fetching through proxy:', proxyUrl);
      
      const response = await fetch(proxyUrl, {
        headers: {
          // Add any necessary headers here
        },
        mode: 'cors',
        credentials: 'omit',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Proxy fetch error:', {
          status: response.status,
          statusText: response.statusText,
          url: proxyUrl,
          error: errorText
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Proxy fetch failed, trying direct fetch:', error);
      
      // Fallback to direct fetch if proxy fails
      try {
        const response = await fetch(url, {
          mode: 'cors',
          credentials: 'omit',
        });
        
        if (!response.ok) {
          throw new Error(`Direct fetch failed: ${response.status} ${response.statusText}`);
        }
        
        return await response.blob();
      } catch (directError: any) {
        console.error('Direct fetch also failed:', directError);
        throw new Error(`Failed to fetch image: ${directError.message || 'Unknown error'}`);
      }
    }
  };

  const handleDownloadSelected = async (downloadAll: boolean = false): Promise<number> => {
    if (!permissions.canDownload) {
      addNotification('Downloads are not permitted in this gallery', 'error');
      return 0;
    }
    try {
      const itemsToDownload = downloadAll
        ? items
        : (downloadSelectedItems.length > 0
            ? items.filter(item => downloadSelectedItems.includes(item.id))
            : []);
      
      if (itemsToDownload.length === 0) {
        addNotification('No items selected for download', 'error');
        return 0;
      }

      setIsDownloading(true);
      setDownloadProgress({ current: 0, total: itemsToDownload.length });
      let successCount = 0;

      // If more than 10 items, create a ZIP file
      if (itemsToDownload.length > 10) {
        try {
          const JSZip = (await import('jszip')).default;
          const zip = new JSZip();
          const folder = zip.folder('arif_photography_downloads') || zip;
          
          // Add each file to the ZIP
          for (let i = 0; i < itemsToDownload.length; i++) {
            const item = itemsToDownload[i];
            try {
              // Use CORS proxy to fetch the image
              const blob = await fetchWithCorsProxy(item.imageUrl);
              const ext = item.isVideo ? 'mp4' : item.imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
              const filename = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
              
              folder.file(filename, blob);
              
              // Update progress
              setDownloadProgress(prev => ({
                current: i + 1,
                total: itemsToDownload.length
              }));
              
              successCount++;
            } catch (error) {
              console.error(`Error processing ${item.title}:`, error);
              // Continue with next file even if one fails
            }
          }
          
          // Generate and download the ZIP file
          addNotification('Creating ZIP file, please wait...', 'info');
          const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
            setDownloadProgress(prev => ({
              current: Math.round((metadata.percent / 100) * itemsToDownload.length),
              total: itemsToDownload.length
            }));
          });
          
          const url = window.URL.createObjectURL(content);
          const a = document.createElement('a');
          a.href = url;
          a.download = `arif_photography_${new Date().toISOString().split('T')[0]}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          addNotification(`Successfully downloaded ${successCount} items in a ZIP file`, 'success');
          return successCount;
        } catch (error: any) {
          console.error('Error creating ZIP:', error);
          addNotification('Failed to create ZIP file. Falling back to individual downloads.', 'error');
          // Fall through to individual downloads
        }
      }

      // If ZIP creation failed or <= 10 items, download individually
      for (let i = 0; i < itemsToDownload.length; i++) {
        const item = itemsToDownload[i];
        try {
          const ext = item.isVideo ? 'mp4' : item.imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
          const filename = `${item.title}.${ext}`;
          
          // Add a small delay between downloads to prevent browser blocking
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          const success = await downloadImage(item.imageUrl, filename);
          if (success) successCount++;
          
          // Update progress
          setDownloadProgress(prev => ({
            current: i + 1,
            total: itemsToDownload.length
          }));
        } catch (error) {
          console.error(`Error downloading ${item.title}:`, error);
        }
      }
      
      if (successCount > 0) {
        addNotification(`Downloaded ${successCount} of ${itemsToDownload.length} items`, 'success');
      } else {
        addNotification('Failed to download any items', 'error');
      }
      
      return successCount;
    } catch (err: any) {
      setIsDownloading(false);
      console.error('Download error:', err);
      addNotification(
        `Failed to download items: ${err.message.includes('Forbidden') ? 'Permission denied - check presigned URL or contact support' : err.message}`,
        'error'
      );
      return 0;
    }
  };

  const openDownloadFlow = () => {
    setIsDownloadModalOpen(true);
    setDownloadStep(1);
  };

  const sendDownloadEmail = async (email: string, total: number, successful: number) => {
    try {
      const res = await fetch('https://nf4htd4och.execute-api.eu-north-1.amazonaws.com/default/mailsend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `Your ${galleryTitle} download ${successful === total ? 'completed' : 'finished'} (${successful}/${total})`,
          proposalId: `download-${Date.now()}`,
          html: `<p>Hi,</p><p>Your download for <strong>${galleryTitle}</strong> has ${successful === total ? 'completed successfully' : 'finished'}.</p><p>Items downloaded: <strong>${successful}</strong> of <strong>${total}</strong>.</p><p>Date: ${new Date().toLocaleString()}</p><p>Thank you,<br/>Arif Photography</p>`
        })
      });
      if (res.ok) {
        addNotification('We will notify you by email once your download is complete', 'success');
      } else {
        addNotification('Email service responded with an error.', 'error');
      }
    } catch (e:any) {
      addNotification(`Failed to send email notification: ${e.message}`, 'error');
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

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  // Access Denied Popup
  if (isAccessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md border border-amber-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mb-6">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-3xl font-light text-gray-900 mb-3 tracking-tight">Access Denied</h2>
            <p className="text-gray-600 text-base leading-relaxed">
              You don't have the access to this shared folder. The link may have been revoked or expired.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-6 bg-amber-900 text-white rounded-xl hover:bg-amber-800 transition-colors font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Loading state while checking access
  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-amber-600" />
          <p className="text-amber-700 font-light">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  // PIN Protection Modal
  if (isPinRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md border border-amber-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full mb-6">
              <Lock className="h-10 w-10 text-amber-700" />
            </div>
            <h2 className="text-3xl font-light text-gray-900 mb-3 tracking-tight">PIN Required</h2>
            <p className="text-gray-600 text-base leading-relaxed">This shared folder is protected. Enter the PIN provided to you to continue.</p>
          </div>

          <div className="space-y-6">
            <div>
              <input
                type="text"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isVerifyingPin && handlePinSubmit()}
                placeholder="Enter PIN"
                maxLength={6}
                disabled={isVerifyingPin}
                className="w-full px-6 py-4 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-center text-2xl tracking-[0.3em] font-light text-gray-900 placeholder-amber-400 transition-all disabled:opacity-50"
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
                onClick={() => navigate('/')}
                disabled={isVerifyingPin}
                className="flex-1 py-3 px-6 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={!pinInput || isVerifyingPin}
                className="flex-1 py-3 px-6 bg-amber-900 text-white rounded-xl hover:bg-amber-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
              >
                {isVerifyingPin ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-amber-600" />
          <p className="text-amber-700 font-light">Loading...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-amber-400 mx-auto mb-6" />
          <h2 className="text-2xl font-light text-gray-900 mb-3">Error Loading Gallery</h2>
          <p className="text-amber-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50">
      {/* Hero Header with Image */}
      <header className="relative w-full h-screen min-h-[600px] overflow-hidden flex flex-col">
        {/* Hero Image Background */}
        {heroImage ? (
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt={galleryTitle}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00djJoLTJ2LTJoMnptMC00djJoLTJ2LTJoMnptLTQtNHYyaC0ydi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=")' }} />
          </div>
        )}
        {/* Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center space-x-4 sm:space-x-6 flex-1 min-w-0">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleBackToGallery}
                    className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors group"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium hidden sm:inline">Home</span>
                  </button>
                  <div className="hidden md:block h-6 w-px bg-white/20" />
                  <h1 className="text-lg font-light text-white hidden md:block">Arif Photography</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
        {/* Hero Content - Positioned at bottom */}
        <div className="relative z-10 w-full px-4 mt-auto mb-16">
          <div className="w-full max-w-3xl mx-auto text-center">
            <div className="text-white/80 text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.25em] uppercase mb-2 sm:mb-4">
              Arif Photography
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-3">
              {galleryTitle}
            </h1>
            <p className="text-white/80 text-sm sm:text-base font-light mb-8">
              A curated collection of beautiful photography
            </p>
          </div>
        </div>
        
        {/* Scroll Indicator - Centered at bottom */}
        <div className="relative z-10 w-full flex justify-center pb-8">
          <a 
            href="#gallery" 
            className="text-white/90 hover:text-white transition-colors" 
            aria-label="Scroll to gallery"
          >
            <ChevronDown className="h-8 w-8 animate-bounce" />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main id="gallery" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {items.length > 0 && (
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={openDownloadFlow}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all text-sm font-medium shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            </div>
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
              ? 'columns-2 sm:columns-3 lg:columns-3 gap-2 sm:gap-4 lg:gap-6'
              : 'space-y-2 sm:space-y-3'
            }>
              {currentItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100/50 ${
                    favoritedItems.includes(item.id) ? 'ring-2 ring-red-500 ring-offset-2' : ''
                  } ${viewMode === 'list' ? 'flex items-center gap-3 p-3 sm:gap-4 sm:p-4' : 'mb-4 sm:mb-6 break-inside-avoid'}`}
                  style={{ contentVisibility: 'auto' }}
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
                    className={`relative ${viewMode === 'list' ? 'w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden' : ''}`}
                    onClick={() => handleViewImage(indexOfFirstItem + index)}
                  >
                    {item.isVideo ? (
                      <div className="w-full h-56 sm:h-64 bg-gray-900 flex items-center justify-center relative">
                        <Play className="h-12 w-12 text-white/90 drop-shadow-lg" />
                      </div>
                    ) : (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
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
              <div className="flex justify-center mt-8 px-4">
                <nav className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 sm:py-2 text-sm sm:text-base rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  
                  {/* First Page */}
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => setCurrentPage(1)}
                        className={`px-3 py-1.5 sm:py-2 text-sm sm:text-base rounded-md ${
                          1 === currentPage
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        1
                      </button>
                      {currentPage > 4 && <span className="px-2 text-gray-500">...</span>}
                    </>
                  )}
                  
                  {/* Page Numbers */}
                  {Array.from(
                    { 
                      length: Math.min(5, Math.ceil(items.length / itemsPerPage)) 
                    }, 
                    (_, i) => {
                      let pageNum;
                      if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= Math.ceil(items.length / itemsPerPage) - 2) {
                        pageNum = Math.ceil(items.length / itemsPerPage) - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      if (pageNum > 0 && pageNum <= Math.ceil(items.length / itemsPerPage)) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`min-w-[36px] sm:min-w-[44px] px-2 py-1.5 sm:py-2 text-sm sm:text-base rounded-md ${
                              pageNum === currentPage
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      return null;
                    }
                  )}
                  
                  {/* Last Page */}
                  {currentPage < Math.ceil(items.length / itemsPerPage) - 2 && (
                    <>
                      {currentPage < Math.ceil(items.length / itemsPerPage) - 3 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(Math.ceil(items.length / itemsPerPage))}
                        className={`px-3 py-1.5 sm:py-2 text-sm sm:text-base rounded-md ${
                          Math.ceil(items.length / itemsPerPage) === currentPage
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {Math.ceil(items.length / itemsPerPage)}
                      </button>
                    </>
                  )}
                  
                  {/* Next Button */}
                  <button
                    onClick={() =>
                      setCurrentPage(prev => Math.min(prev + 1, Math.ceil(items.length / itemsPerPage)))
                    }
                    disabled={currentPage === Math.ceil(items.length / itemsPerPage)}
                    className="px-3 py-1.5 sm:py-2 text-sm sm:text-base rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </nav>
                
                {/* Mobile Page Info */}
                <div className="mt-2 text-center sm:hidden text-sm text-gray-600">
                  Page {currentPage} of {Math.ceil(items.length / itemsPerPage)}
                </div>
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
      {/* Download progress bar */}
      {isDownloading && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-gray-200">
            <div
              className="h-1 bg-gray-900 transition-all"
              style={{ width: `${downloadProgress.total ? (downloadProgress.current / downloadProgress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
      {/* Preloading runs silently without UI */}
      {/* Enhanced Download Flow Modal */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all duration-300 ease-in-out">
            {/* Header */}
            <div className="bg-gray-900 text-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {downloadStep === 1 ? 'Download Options' : 'Download Ready'}
                </h2>
                <button 
                  onClick={() => {
                    setIsDownloadModalOpen(false);
                    setDownloadStep(1);
                    setEmailInput('');
                  }}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            {isModalProcessing && (
              <div className="h-1 bg-gray-100">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{
                    width: `${(downloadProgress.current / downloadProgress.total) * 100}%`,
                    transition: 'width 0.3s ease-out'
                  }}
                />
              </div>
            )}
            
            <div className="p-6">
              {downloadStep === 1 ? (
                <div className="space-y-6">
                  <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Download className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900">Download {downloadSelectedItems.length || 'All'} Items</h3>
                      <p className="text-sm text-gray-500">
                        {downloadSelectedItems.length > 10 ? 
                         'Your files will be downloaded as a ZIP archive.' : 
                         'Your files will be downloaded individually.'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address (Optional)
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        We'll send you a download link to your email
                      </p>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <div className="flex items-center">
                        <input
                          id="terms"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                          I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-3 pt-2">
                    <button
                      onClick={async () => {
                        setDownloadStep(3);
                        setIsModalProcessing(true);
                        await handleDownloadSelected(true);
                        setIsModalProcessing(false);
                      }}
                      className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download All ({items.length} Items)
                    </button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">or</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={async () => {
                        setDownloadStep(3);
                        setIsModalProcessing(true);
                        await handleDownloadSelected(false);
                        setIsModalProcessing(false);
                      }}
                      disabled={downloadSelectedItems.length === 0}
                      className={`w-full flex items-center justify-center px-6 py-3 border rounded-lg shadow-sm text-base font-medium ${
                        downloadSelectedItems.length > 0 
                          ? 'text-gray-700 bg-white hover:bg-gray-50' 
                          : 'text-gray-400 bg-gray-50 cursor-not-allowed'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                    >
                      {downloadSelectedItems.length > 0 ? (
                        <>
                          <Download className="h-5 w-5 mr-2" />
                          Download Selected ({downloadSelectedItems.length} Items)
                        </>
                      ) : (
                        'Select items to download'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    {isModalProcessing ? 'Preparing Your Download...' : 'Download Ready'}
                  </h3>
                  
                  {isModalProcessing ? (
                    <div className="mt-6 space-y-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${(downloadProgress.current / downloadProgress.total) * 100}%`,
                            transition: 'width 0.3s ease-out'
                          }}
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        {downloadProgress.current} of {downloadProgress.total} files processed
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 text-sm text-gray-500">
                        {downloadSelectedItems.length > 10 || items.length > 10 ?
                          'Your ZIP file is ready to download.' :
                          'Your files are ready to download.'}
                      </p>
                      {downloadInlineMsg && (
                        <p className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                          {downloadInlineMsg}
                        </p>
                      )}
                      <div className="mt-6">
                        <button
                          onClick={() => {
                            setIsDownloadModalOpen(false);
                            setDownloadStep(1);
                            setEmailInput('');
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
      <footer className="bg-gradient-to-t from-stone-900 to-stone-800 text-white mt-20">
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
                  className="flex items-center gap-3 text-gray.ts-400 hover:text-white transition-colors group"
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
                  &copy; {new Date().getFullYear()} Arif Photography | All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default SharedImages;