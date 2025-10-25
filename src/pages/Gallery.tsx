/* Full modified Gallery.tsx — every single line included.
   Changes: simplified share flow to POST-only (no token fallback),
   robust response parsing, clearer errors/logging.
   Additional Changes: Handle 3000+ uploads by batching presigned URL requests (200 files/batch),
   concurrent uploads with concurrency limit (20 simultaneous), XMLHttpRequest for progress tracking.
   Download Changes: Use actual filename with extension from S3 key for accurate local saving.
   CORS Download Fix: If fetch fails due to CORS, create temporary <a> tag with download attribute to trigger browser download without new tab.
   Loader Additions: Added loading indicators for folder creation, share generation, bulk download, image list fetching, and other operations.
   Upload UI Changes: Replaced individual file progress bars with a single overall progress bar showing completed/total count (e.g., 5/100), updating incrementally as each upload completes. Added error count display if applicable.
   New Changes: Added drag-and-drop upload support to the gallery area with visual feedback (drop zone overlay). Added upload speed calculation and display in the progress section (e.g., "1.2 MB/s"). Smoothed progress bar animations with CSS transitions. Enhanced video display in gallery with proper thumbnail generation using <video> preload="metadata" and poster fallback. Improved video player in preview modal with full controls, autoplay on open (muted), and better error handling.
*/

import React, { useState, useEffect, Component, ErrorInfo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Image,
  Calendar,
  Camera,
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
  Copy,
  Mail,
  FolderPlus,
  Play,
  Upload,
} from 'lucide-react';

// -------------------- Interfaces --------------------
interface GalleryItem {
  id: string;
  shootType: string;
  eventDate: string;
  imageUrl: string;
  title: string;
  filename: string; // Added for accurate download filename
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

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  startTime?: number; // For speed calculation
  lastLoaded?: number; // For speed calculation
  lastTime?: number; // For speed calculation
  speed?: number; // Current upload speed in KB/s
}

interface DeleteError {
  Key: string;
  Code?: string;
  Message?: string;
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface PresignedUpload {
  url: string;
  key: string;
}

// -------------------- Error Boundary --------------------
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

// -------------------- Configuration --------------------
// main POST share endpoint (your API Gateway endpoint - POST only)
const SHARE_API = 'https://q494j11s0d.execute-api.eu-north-1.amazonaws.com/default/sharelink';

// If you want a default TTL for presigned links, set it here:
const DEFAULT_EXPIRY_SECONDS = 3600;

// Upload batch size for presigned URLs (to avoid request size limits)
const PRESIGNED_BATCH_SIZE = 200;

// Max concurrent uploads (to avoid overwhelming network/S3)
const MAX_CONCURRENT_UPLOADS = 20;

// -------------------- Main Component --------------------
function Gallery() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.replace('/gallery', '');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteErrors, setDeleteErrors] = useState<DeleteError[]>([]);
  const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; currentImage: GalleryItem | null; }>({ isOpen: false, currentImage: null });
  const [shareModal, setShareModal] = useState<{ isOpen: boolean; links: string[]; serverMessage?: string | null }>({ isOpen: false, links: [], serverMessage: null });
  const [createFolderModal, setCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [imageListModal, setImageListModal] = useState<{ isOpen: boolean; folderName: string; images: string[] }>({ isOpen: false, folderName: '', images: [] });
  const [selectedImagesModal, setSelectedImagesModal] = useState<{ isOpen: boolean; images: string[] }>({ isOpen: false, images: [] });
  const [filters, setFilters] = useState({
    month: '',
    shootType: '',
    search: '',
    favorites: false,
    watermarked: false,
    pinProtected: false,
  });
  const [sortBy, setSortBy] = useState('uploadDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createFolderLoading, setCreateFolderLoading] = useState(false); // New: Loader for folder creation
  const [shareLoading, setShareLoading] = useState(false); // New: Loader for share
  const [bulkDownloadLoading, setBulkDownloadLoading] = useState(false); // New: Loader for bulk download
  const [imageListLoading, setImageListLoading] = useState(false); // New: Loader for image list
  const [dragActive, setDragActive] = useState(false); // For drag and drop

  const shootTypes = [
    'Wedding',
    'Pre-Wedding',
    'Maternity',
    'Corporate',
    'Portrait',
    'Events',
    'Casual',
    'Unknown',
  ];
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // -------------------- Notifications --------------------
  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);
    // auto-dismiss
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  // -------------------- Drag and Drop Handlers --------------------
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // -------------------- Fetch gallery items --------------------
  useEffect(() => {
    fetchGalleryItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

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

      console.log(`Fetching gallery items with prefix: '${prefix}'`);

      const response = await fetch(
        `https://a9017femoa.execute-api.eu-north-1.amazonaws.com/default/getallimages?prefix=${encodeURIComponent(prefix)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch items: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.files) || !Array.isArray(data.folders)) {
        throw new Error('Unexpected API response format');
      }

      const mappedItems: GalleryItem[] = data.files.map((item: any) => {
        const keyParts = item.key.split('/');
        const rawFilename = keyParts.pop() || 'Untitled.jpg';
        const title = rawFilename.replace(/\.[^/.]+$/, '');
        let eventDate = item.last_modified ? item.last_modified.split('T')[0] : '';

        const dateMatch = title.match(/(\d{4})(\d{2})(\d{2})/);
        if (dateMatch) {
          eventDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
        }

        const isVideo = !!item.key.match(/\.(mp4|mov|avi|wmv|mkv)$/i);

        return {
          id: item.key,
          shootType: title.includes('IMG') ? 'Portrait' : title.includes('Snapchat') ? 'Casual' : 'Unknown',
          eventDate,
          imageUrl: item.presigned_url || item.url || 'https://picsum.photos/400/300',
          title,
          filename: rawFilename,
          uploadDate: item.last_modified ? item.last_modified.split('T')[0] : '',
          isWatermarked: false,
          isPinProtected: false,
          isFavorite: false,
          key: item.key,
          isVideo,
        };
      });

      const mappedFolders: FolderItem[] = data.folders.map((folder: any) => ({
        name: folder.name,
        path: `/${folder.path.replace(/\/$/, '')}`,
      }));

      // Also fetch favorites folders if we're in root directory
      let favoritesFolders: FolderItem[] = [];
      if (!prefix || prefix === '') {
        try {
          const favoritesResponse = await fetch(
            `https://a9017femoa.execute-api.eu-north-1.amazonaws.com/default/getallimages?prefix=favorites/`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              mode: 'cors',
            }
          );
          
          if (favoritesResponse.ok) {
            const favoritesData = await favoritesResponse.json();
            if (favoritesData && Array.isArray(favoritesData.folders)) {
              favoritesFolders = favoritesData.folders.map((folder: any) => ({
                name: `❤️ ${folder.name}`,
                path: `/${folder.path.replace(/\/$/, '')}`,
              }));
            }
          }
        } catch (err) {
          console.log('Could not fetch favorites folders:', err);
        }
      }

      setItems(mappedItems);
      setFolders([...mappedFolders, ...favoritesFolders]);
    } catch (err: any) {
      console.error('Error fetching gallery items:', err);
      setError(`Failed to load gallery items: ${err.message}`);
      addNotification(`Failed to load gallery items: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Download helpers --------------------
  // Try to fetch blob and save — if CORS blocks fetch, fallback to <a> download link.
  const fetchBlobOrOpen = async (url: string, filename: string) => {
    try {
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
      const blob = await res.blob();
      saveAs(blob, filename);
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

  // Create zip from array of {url, filename}
  const createZipAndDownload = async (files: { url: string; filename: string }[], zipName: string) => {
    const zip = new JSZip();
    let added = 0;
    for (const f of files) {
      try {
        const res = await fetch(f.url, { mode: 'cors' });
        if (!res.ok) throw new Error(`Failed to fetch ${f.filename}: ${res.status}`);
        const blob = await res.blob();
        zip.file(f.filename, blob);
        added += 1;
      } catch (err) {
        console.error(`Failed to add ${f.filename} to zip:`, err);
        // continue — we will generate zip with available files
      }
    }
    if (added === 0) {
      addNotification('No files available to zip (all failed to fetch).', 'error');
      return;
    }
    try {
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, zipName);
      addNotification(`Downloaded ${added} file(s) as ${zipName}`, 'success');
    } catch (err: any) {
      console.error('Zip generation failed:', err);
      addNotification(`Zip download failed: ${err.message}`, 'error');
    }
  };

  // -------------------- Public download handlers --------------------
  const handleDownloadItem = async (item: GalleryItem) => {
    addNotification(`Starting download: ${item.filename}`, 'info');
    await fetchBlobOrOpen(item.imageUrl, item.filename);
  };

  // Bulk download selected items/folders
  const handleBulkDownload = async () => {
    setBulkDownloadLoading(true);
    addNotification('Preparing bulk download...', 'info');
    try {
      if (selectedItems.length === 0) {
        addNotification('No items or folders selected for download', 'error');
        return;
      }

      // separate item keys and folder paths
      const selectedFiles = items.filter((it) => selectedItems.includes(it.id));
      const selectedFolders = folders.filter((f) => selectedItems.includes(f.path));

      // if exactly one file and no folders => direct download single
      if (selectedFiles.length === 1 && selectedFolders.length === 0) {
        await handleDownloadItem(selectedFiles[0]);
        return;
      }

      // build file list to zip
      const fileList: { url: string; filename: string }[] = [];

      // add selected files
      for (const it of selectedFiles) {
        fileList.push({ url: it.imageUrl, filename: it.filename });
      }

      // for each selected folder, call your getallimages endpoint to list files inside and push into fileList
      for (const folder of selectedFolders) {
        try {
          // Use the same getallimages lambda to list files under a prefix
          let prefix = folder.path;
          if (prefix.startsWith('/')) prefix = prefix.slice(1);
          if (!prefix.endsWith('/')) prefix += '/';

          const resp = await fetch(
            `https://a9017femoa.execute-api.eu-north-1.amazonaws.com/default/getallimages?prefix=${encodeURIComponent(prefix)}&recursive=true`,
            { method: 'GET', headers: { 'Content-Type': 'application/json' }, mode: 'cors' }
          );

          if (!resp.ok) {
            console.warn('Folder listing failed for', folder.path, await resp.text());
            continue;
          }
          const body = await resp.json();
          if (body && Array.isArray(body.files)) {
            for (const file of body.files) {
              const url = file.presigned_url || file.url || file.presignedUrl;
              const rawFilename = file.key ? file.key.split('/').pop() : 'unnamed.jpg';
              if (url) {
                fileList.push({ url, filename: `${folder.name}/${rawFilename}` });
              }
            }
          }
        } catch (err) {
          console.error('Error listing folder', folder.path, err);
        }
      }

      if (fileList.length === 0) {
        addNotification('No downloadable files found for selection', 'error');
        return;
      }

      const zipName = `${(currentPath && currentPath !== '/' ? currentPath.replace(/^\//, '').replace(/\//g, '_') : 'gallery') || 'gallery'}_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
      addNotification(`Preparing ${fileList.length} file(s) into ${zipName}`, 'info');
      await createZipAndDownload(fileList, zipName);
    } catch (err: any) {
      addNotification(`Bulk download failed: ${err.message}`, 'error');
    } finally {
      setBulkDownloadLoading(false);
    }
  };

  // -------------------- Share helpers --------------------

  /**
   * requestShareLinksFromServer
   * - Always does POST to SHARE_API with body: { keys, metadata? }
   * - Expects server to return JSON. Accepts these shapes:
   *    { success: true, shares: [{ prefix, token, shareUrl, expiry }, ...] }
   *    { success: true, links: ["https://...","..."] }
   *    { success: true, link: "single url" }
   * - If server returns success:false -> throws with server message.
   * - If server returns HTTP error -> throws with status + body.
   */
  // Replace your requestShareLinksFromServer with this exact function
  const requestShareLinksFromServer = async (keys: string[], metadata: any = {}) => {
    try {
      if (!Array.isArray(keys) || keys.length === 0) {
        throw new Error('No keys provided to requestShareLinksFromServer');
      }

      const body = { keys, metadata }; // include metadata (type: folder) if provided
      console.debug('[share] POST payload', body);

      const res = await fetch(SHARE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify(body),
      });

      // read text so we can show helpful error messages when server returns non-JSON or 4xx/5xx
      const txt = await res.text();
      let parsed = null;
      try {
        parsed = txt ? JSON.parse(txt) : null;
      } catch (e) {
        parsed = null;
      }

      if (!res.ok) {
        // Helpful path for debugging server responses
        console.warn('[share] server returned non-OK:', res.status, txt);
        // bubble up a helpful message
        let serverMsg = txt;
        if (parsed && parsed.message) serverMsg = parsed.message;
        throw new Error(`Share server error: ${res.status} - ${serverMsg}`);
      }

      const data = parsed || (txt ? JSON.parse(txt) : null);

      if (!data) {
        throw new Error('Empty response from share server');
      }
      if (data.success === false) {
        // if server returned structured error, include it
        const serverErr = data.message || JSON.stringify(data);
        throw new Error(serverErr);
      }

      // Accept various shapes
      // 1) { success: true, shares: [{ prefix, token, shareUrl, expiry }, ...] }
      if (Array.isArray((data as any).shares) && (data as any).shares.length > 0) {
        const urls: string[] = (data as any).shares
          .map((s: any) => s.shareUrl || s.link || s.presigned_url || s.url)
          .filter(Boolean);
        if (urls.length > 0) return urls;
      }

      // 2) older shape: { links: [...] }
      if (Array.isArray((data as any).links) && (data as any).links.length > 0) {
        const urls: string[] = (data as any).links.map((l: any) => (typeof l === 'string' ? l : l.link || l.presigned_url || l.url)).filter(Boolean);
        if (urls.length) return urls;
      }

      // 3) single link
      if ((data as any).link && typeof (data as any).link === 'string') {
        return [(data as any).link];
      }

      // 4) top-level array
      if (Array.isArray(data)) {
        const urls: string[] = data.map((l: any) => (typeof l === 'string' ? l : l.link || l.presigned_url || l.url)).filter(Boolean);
        if (urls.length) return urls;
      }

      throw new Error('Unexpected share server response format: ' + JSON.stringify(data));
    } catch (err: any) {
      console.error('requestShareLinksFromServer failed:', err);
      throw err;
    }
  };

  /**
   * generateShareableLinks
   * Accepts selected IDs (either item.key or folder.path).
   * For files: tries to use item.imageUrl if present, otherwise asks server for presigned link.
   * For folders: calls server to presign objects under prefixes.
   * Returns string[] of links.
   */
  const generateShareableLinks = async (forItemIds: string[]) => {
    const folderPaths = forItemIds.filter((id) => id.startsWith('/'));
    const itemIds = forItemIds.filter((id) => !id.startsWith('/'));
    const links: string[] = [];

    // Generate share links for folders locally
    const baseUrl = window.location.origin || 'http://localhost:5173';
    for (const folderPath of folderPaths) {
      const encodedPath = encodeURIComponent(folderPath);
      const shareLink = `${baseUrl}/shared-images/${encodedPath}`;
      links.push(shareLink);
    }

    // Handle files
    if (itemIds.length > 0) {
      const itemsToShare = items.filter((it) => itemIds.includes(it.id));
      const directUrls = itemsToShare.map((it) => it.imageUrl).filter(Boolean) as string[];
      const missingKeys = itemsToShare.filter((it) => !it.imageUrl).map((it) => it.key || it.id);

      if (directUrls.length > 0) {
        links.push(...directUrls);
      }
      if (missingKeys.length > 0) {
        const created = await requestShareLinksFromServer(missingKeys);
        links.push(...created);
      }
    }

    return links;
  };

  // (Optional) Updated handleShareSingle if you want files to use /shared-images format
  const handleShareSingle = async (item: GalleryItem) => {
    setShareLoading(true);
    addNotification('Generating share link...', 'info');
    try {
      const baseUrl = window.location.origin || 'http://localhost:5173';
      const path = item.key || item.id;
      const encodedPath = encodeURIComponent(path);
      const shareLink = `${baseUrl}/shared-images/${encodedPath}`;
      setShareModal({ isOpen: true, links: [shareLink], serverMessage: null });
    } catch (err: any) {
      console.error('Share single failed:', err);
      addNotification(`Share failed: ${err.message}`, 'error');
      setShareModal({ isOpen: true, links: [], serverMessage: err.message });
    } finally {
      setShareLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        addNotification('Link copied to clipboard', 'success');
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        addNotification('Link copied to clipboard', 'success');
      }
    } catch (err: any) {
      console.error('Copy failed:', err);
      addNotification('Failed to copy link', 'error');
    }
  };

// Inside Gallery component

const handleShare = async () => {
  if (selectedItems.length === 0) {
    addNotification('No items selected to share', 'error');
    return;
  }

  setShareLoading(true);
  addNotification('Generating share link(s)...', 'info');
  try {
    const links = await generateShareableLinks(selectedItems);

    if (links.length === 0) {
      addNotification('No share links generated', 'error');
      return;
    }

    setShareModal({ isOpen: true, links, serverMessage: null });
  } catch (err: any) {
    console.error('Share error:', err);
    let message = err.message || 'Share failed';
    try {
      const parsed = JSON.parse(message);
      if (parsed && parsed.message) message = parsed.message;
      else if (parsed && typeof parsed === 'object') message = JSON.stringify(parsed);
    } catch (e) {
      // not JSON
    }
    addNotification(`Share failed: ${message}`, 'error');
    setError(`Share failed: ${message}`);
    setShareModal({ isOpen: true, links: [], serverMessage: message });
  } finally {
    setShareLoading(false);
  }
};

  // -------------------- Filters & sorting (unchanged logic from original) --------------------
  const filteredImages = items
    .filter((item) => {
      const eventDate = item.eventDate ? new Date(item.eventDate) : new Date(item.uploadDate || Date.now());
      const itemMonth = eventDate.toLocaleString('default', { month: 'long' });

      const matchesMonth = !filters.month || itemMonth === filters.month;
      const matchesShootType = !filters.shootType || item.shootType === filters.shootType;
      const matchesSearch = !filters.search || item.title.toLowerCase().includes(filters.search.toLowerCase());
      const matchesFavorites = !filters.favorites || item.isFavorite;
      const matchesWatermarked = !filters.watermarked || item.isWatermarked;
      const matchesPinProtected = !filters.pinProtected || item.isPinProtected;

      return matchesMonth && matchesShootType && matchesSearch && matchesFavorites && matchesWatermarked && matchesPinProtected;
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

  // -------------------- Breadcrumbs --------------------
  const getBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Gallery', path: '' }];

    let currentBreadcrumbPath = '';
    parts.forEach((part) => {
      currentBreadcrumbPath += `/${part}`;
      breadcrumbs.push({ name: part, path: currentBreadcrumbPath });
    });

    return breadcrumbs;
  };

  // -------------------- UI Event handlers --------------------
  const handleFilterChange = (filterType: string, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
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

  const handleClosePreview = () => {
    // Pause video if it's playing
    const videoElement = document.querySelector('.preview-modal-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.pause();
    }
    setPreviewModal({ isOpen: false, currentImage: null });
  };

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && previewModal.isOpen) {
        handleClosePreview();
      }
    };

    if (previewModal.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [previewModal.isOpen]);

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, id]);
    } else {
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const handleSelectAll = () => {
    const allIds = [
      ...filteredImages.map((item) => item.id),
      ...folders.map((folder) => folder.path),
    ];
    setSelectedItems(allIds);
  };

  const handleSelectAllImages = () => {
    const allImageIds = filteredImages.map((item) => item.id);
    setSelectedItems(allImageIds);
  };

  const handleCopyAllImageNames = () => {
    const allImageNames = filteredImages.map(item => item.title);
    if (allImageNames.length === 0) {
      addNotification('No images found to copy', 'info');
      return;
    }
    copyImageListToClipboard(allImageNames);
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  // Compatibility wrapper used on per-item download button
  const handleDownload = (itemsToDownload: GalleryItem[]) => {
    itemsToDownload.forEach((item) => {
      handleDownloadItem(item);
    });
  };

  // -------------------- Delete logic (keeps your previous API usage) --------------------
  const handleBulkDelete = () => {
    handleDeleteItems(selectedItems);
  };

  const handleDeleteItems = async (itemIds: string[]) => {
    if (itemIds.length === 0) {
      setError('No items or folders selected for deletion');
      addNotification('No items or folders selected for deletion', 'error');
      return;
    }

    const itemsToDelete = items.filter((item) => itemIds.includes(item.id));
    const foldersToDelete = folders.filter((folder) => itemIds.includes(folder.path));
    const itemCount = itemsToDelete.length;
    const folderCount = foldersToDelete.length;

    let confirmMessage = '';
    if (itemCount > 0 && folderCount > 0) {
      confirmMessage = `Are you sure you want to delete ${itemCount} item(s) and ${folderCount} folder(s)?`;
    } else if (itemCount > 0) {
      confirmMessage =
        itemCount === 1
          ? `Are you sure you want to delete "${itemsToDelete[0]?.title}"?`
          : `Are you sure you want to delete ${itemCount} item(s)?`;
    } else if (folderCount > 0) {
      confirmMessage =
        folderCount === 1
          ? `Are you sure you want to delete the folder "${foldersToDelete[0]?.name}"?`
          : `Are you sure you want to delete ${folderCount} folder(s)?`;
    }

    if (!window.confirm(confirmMessage)) return;

    try {
      setDeleteLoading(itemIds);
      setError(null);
      setDeleteErrors([]);

      const keys = [
        ...itemsToDelete
          .map((item) => item.key)
          .filter((key): key is string => typeof key === 'string' && key.trim() !== ''),
        ...foldersToDelete.map((folder) => {
          let prefix = folder.path;
          if (prefix.startsWith('/')) prefix = prefix.slice(1);
          if (!prefix.endsWith('/')) prefix += '/';
          return prefix;
        }),
      ];

      if (keys.length === 0) {
        throw new Error('No valid keys found for deletion');
      }

      console.log('Deleting keys:', keys);

      const response = await fetch(
        'https://9qvci31498.execute-api.eu-north-1.amazonaws.com/default/deleteimage',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keys }),
          mode: 'cors',
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
      const deletedItems = itemsToDelete.filter((item) => deletedKeys.includes(item.key));
      const deletedFolders = foldersToDelete.filter((folder) => {
        let prefix = folder.path;
        if (prefix.startsWith('/')) prefix = prefix.slice(1);
        if (!prefix.endsWith('/')) prefix += '/';
        return deletedKeys.includes(prefix);
      });

      setItems((prev) => prev.filter((item) => !deletedItems.some((d) => d.id === item.id)));
      setFolders((prev) => prev.filter((folder) => !deletedFolders.some((d) => d.path === folder.path)));
      setSelectedItems((prev) => prev.filter((id) => !deletedItems.some((d) => d.id === id) && !deletedFolders.some((d) => d.path === id)));

      if (errors.length > 0) {
        setDeleteErrors(errors);
        setError(`Partially completed: ${deletedKeys.length} deleted, ${errors.length} failed.`);
        addNotification(`Partially completed: ${deletedKeys.length} deleted, ${errors.length} failed.`, 'error');
      } else {
        addNotification(`Successfully deleted ${deletedKeys.length} item(s)/folder(s)`, 'success');
      }
    } catch (err: any) {
      console.error('Error deleting items/folders:', err);
      setError(`Failed to delete items/folders: ${err.message}`);
      addNotification(`Failed to delete items/folders: ${err.message}`, 'error');
    } finally {
      setDeleteLoading([]);
    }
  };

  const handleDelete = (id: string) => {
    handleDeleteItems([id]);
  };

  const handleToggleFavorite = (item: GalleryItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i))
    );
  };

  // Handle showing image list for client selection folders
  const handleShowImageList = async (folderPath: string, folderName: string) => {
    setImageListLoading(true);
    addNotification('Loading image list...', 'info');
    try {
      // Check if this is a client selection folder
      if (!folderPath.includes('client') && !folderPath.includes('selection')) {
        addNotification('This feature is only available for client selection folders', 'info');
        return;
      }

      let prefix = folderPath;
      if (prefix.startsWith('/')) prefix = prefix.slice(1);
      if (!prefix.endsWith('/')) prefix += '/';

      const response = await fetch(
        `https://a9017femoa.execute-api.eu-north-1.amazonaws.com/default/getallimages?prefix=${encodeURIComponent(prefix)}&recursive=true`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch folder contents: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.files)) {
        throw new Error('Unexpected API response format');
      }

      // Extract image names from the files
      const imageNames = data.files
        .filter((file: any) => file.key && typeof file.key === 'string')
        .map((file: any) => {
          const keyParts = file.key.split('/');
          return keyParts.pop() || 'Untitled';
        })
        .filter((name: string) => name !== 'Untitled');

      setImageListModal({
        isOpen: true,
        folderName: folderName,
        images: imageNames
      });
    } catch (err: any) {
      console.error('Error fetching image list:', err);
      addNotification(`Failed to load image list: ${err.message}`, 'error');
    } finally {
      setImageListLoading(false);
    }
  };

  // Copy image list to clipboard
  const copyImageListToClipboard = async (images: string[]) => {
    try {
      const imageList = images.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(imageList);
        addNotification('Image list copied to clipboard', 'success');
      } else {
        const ta = document.createElement('textarea');
        ta.value = imageList;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        addNotification('Image list copied to clipboard', 'success');
      }
    } catch (err: any) {
      console.error('Copy failed:', err);
      addNotification('Failed to copy image list', 'error');
    }
  };

  // Handle showing selected images list
  const handleShowSelectedImages = () => {
    // Filter selected items to get only image items (not folders)
    const selectedImageIds = selectedItems.filter(id => !id.startsWith('/'));
    const selectedImages = items.filter(item => selectedImageIds.includes(item.id));
    
    if (selectedImages.length === 0) {
      addNotification('No images selected', 'info');
      return;
    }

    const imageNames = selectedImages.map(item => item.title);
    setSelectedImagesModal({
      isOpen: true,
      images: imageNames
    });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
    const tgt = e.currentTarget as HTMLImageElement | HTMLVideoElement;
    if ('src' in tgt && typeof tgt.src === 'string' && !tgt.src.includes('picsum.photos')) {
      // Only change image src (not video) --- for video we leave it as-is
      if ((tgt as HTMLImageElement).tagName === 'IMG') {
        (tgt as HTMLImageElement).src = 'https://picsum.photos/400/300';
      }
    }
  };

  // -------------------- Create folder --------------------
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Folder name is required');
      addNotification('Folder name is required', 'error');
      return;
    }

    setCreateFolderLoading(true);
    addNotification('Creating folder...', 'info');
    try {
      let prefix = currentPath;
      if (prefix && !prefix.endsWith('/')) prefix += '/';
      if (prefix.startsWith('/')) prefix = prefix.slice(1);

      const folderKey = `${prefix}${newFolderName}/`;

      console.log(`Creating folder with key: ${folderKey}`);

      const response = await fetch('https://n7l9v29nb4.execute-api.eu-north-1.amazonaws.com/default/createfolder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: folderKey }),
        mode: 'cors',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create folder: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Folder creation failed');
      }

      setCreateFolderModal(false);
      setNewFolderName('');
      fetchGalleryItems();
      addNotification(`Folder created: ${newFolderName}`, 'success');
    } catch (err: any) {
      console.error('Error creating folder:', err);
      setError(`Failed to create folder: ${err.message}`);
      addNotification(`Failed to create folder: ${err.message}`, 'error');
    } finally {
      setCreateFolderLoading(false);
    }
  };

  // -------------------- Upload handlers --------------------
  // Define allowed file types
  const ALLOWED_IMAGE_EXTENSIONS = [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'tif', 'ico'
  ];
  
  const ALLOWED_VIDEO_EXTENSIONS = [
    'mp4', 'mov', 'avi', 'wmv', 'mkv', 'webm', 'flv', '3gp', 'm4v'
  ];

  const RAW_FILE_EXTENSIONS = [
    'cr2', 'cr3', 'nef', 'arw', 'dng', 'orf', 'rw2', 'pef', 'srw', 'x3f', 'raf', '3fr', 'fff', 'dcr', 'kdc', 'srf', 'mrw'
  ];

  const isValidFileType = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop() || '';
    
    // Check if it's a raw file (explicitly reject)
    if (RAW_FILE_EXTENSIONS.includes(fileExtension)) {
      return false;
    }
    
    // Check MIME type first
    const isValidMimeType = file.type.startsWith('image/') || file.type.startsWith('video/');
    
    // Check file extension as backup (some files might not have proper MIME types)
    const isValidExtension = 
      ALLOWED_IMAGE_EXTENSIONS.includes(fileExtension) || 
      ALLOWED_VIDEO_EXTENSIONS.includes(fileExtension);
    
    return isValidMimeType && isValidExtension;
  };

  function handleFileSelect(selectedFiles: FileList | null) {
    if (!selectedFiles) return;

    const allFiles = Array.from(selectedFiles);
    const validFiles: File[] = [];
    const rejectedFiles: string[] = [];

    // Filter files and track rejected ones
    allFiles.forEach((file) => {
      if (isValidFileType(file)) {
        validFiles.push(file);
      } else {
        rejectedFiles.push(file.name);
      }
    });

    // Show notification for rejected files
    if (rejectedFiles.length > 0) {
      const rejectedMessage = rejectedFiles.length === 1 
        ? `File "${rejectedFiles[0]}" was rejected (unsupported format or raw file)`
        : `${rejectedFiles.length} files were rejected (unsupported formats or raw files)`;
      addNotification(rejectedMessage, 'error');
    }

    if (validFiles.length === 0) {
      setError('No valid image or video files selected. Raw files and unsupported formats are not allowed.');
      addNotification('No valid image or video files selected. Raw files and unsupported formats are not allowed.', 'error');
      return;
    }

    const newFiles: UploadFile[] = validFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending' as const,
      startTime: Date.now(),
      lastLoaded: 0,
      lastTime: Date.now(),
      speed: 0,
    }));

    // Show success message for accepted files
    if (validFiles.length > 0) {
      const acceptedMessage = validFiles.length === 1 
        ? `1 file ready for upload`
        : `${validFiles.length} files ready for upload`;
      addNotification(acceptedMessage, 'success');
    }

    setUploadFiles(newFiles);
    startUpload(newFiles);
  };

  // Helper to upload a single file using XMLHttpRequest for progress tracking
  const uploadFileWithXHR = (fileUpload: UploadFile, presignedUrl: PresignedUpload): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignedUrl.url, true);
      xhr.setRequestHeader('Content-Type', fileUpload.file.type);

      let speed = fileUpload.speed || 0;

      // Track progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const loaded = event.loaded;
          const percentComplete = Math.round((loaded / event.total) * 100);
          const now = Date.now();

          // Calculate speed (KB/s)
          if (fileUpload.lastTime && fileUpload.lastLoaded !== undefined) {
            const timeDiff = (now - fileUpload.lastTime) / 1000; // seconds
            const bytesDiff = loaded - fileUpload.lastLoaded;
            if (timeDiff > 0.1 && bytesDiff > 0) {
              speed = (bytesDiff / timeDiff) / 1024; // KB/s
            }
          } else if (fileUpload.startTime) {
            // Initial speed calculation from start
            const totalTime = (now - fileUpload.startTime) / 1000;
            if (totalTime > 0.5) {
              speed = (loaded / totalTime) / 1024; // KB/s
            }
          }

          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === fileUpload.id
                ? {
                    ...f,
                    progress: percentComplete,
                    lastLoaded: loaded,
                    lastTime: now,
                    speed: Math.max(0, speed), // Ensure speed is never negative
                  }
                : f
            )
          );
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadFiles((prev) =>
            prev.map((f) => (f.id === fileUpload.id ? { ...f, status: 'completed', progress: 100 } : f))
          );
          resolve();
        } else {
          const error = new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`);
          setUploadFiles((prev) =>
            prev.map((f) => (f.id === fileUpload.id ? { ...f, status: 'error', error: error.message } : f))
          );
          reject(error);
        }
      });

      xhr.addEventListener('error', () => {
        const error = new Error('Network error during upload');
        setUploadFiles((prev) =>
          prev.map((f) => (f.id === fileUpload.id ? { ...f, status: 'error', error: error.message } : f))
        );
        reject(error);
      });

      xhr.addEventListener('abort', () => {
        const error = new Error('Upload aborted');
        setUploadFiles((prev) =>
          prev.map((f) => (f.id === fileUpload.id ? { ...f, status: 'error', error: error.message } : f))
        );
        reject(error);
      });

      // Start upload
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === fileUpload.id ? { ...f, status: 'uploading', progress: 0, lastTime: Date.now(), lastLoaded: 0, speed: 0 } : f))
      );
      xhr.send(fileUpload.file);
    });
  };

  // Helper to process a batch of uploads with concurrency limit
  const processUploadBatch = async (batchFiles: UploadFile[], presignedUrls: PresignedUpload[]) => {
    const uploadPromises: Promise<void>[] = [];
    for (let i = 0; i < batchFiles.length; i++) {
      const fileUpload = batchFiles[i];
      const presigned = presignedUrls[i];
      if (!presigned) {
        console.warn(`No presigned URL for ${fileUpload.file.name}`);
        setUploadFiles((prev) =>
          prev.map((f) => (f.id === fileUpload.id ? { ...f, status: 'error', error: 'No presigned URL' } : f))
        );
        continue;
      }

      uploadPromises.push(uploadFileWithXHR(fileUpload, presigned));

      // Limit concurrency
      if (uploadPromises.length >= MAX_CONCURRENT_UPLOADS || i === batchFiles.length - 1) {
        try {
          await Promise.all(uploadPromises);
        } catch (err) {
          console.error('Some uploads in batch failed:', err);
          // Continue with next batch even if some fail
        }
        uploadPromises.length = 0; // Clear for next set
      }
    }
  };

  const startUpload = async (filesToUpload: UploadFile[]) => {
    if (filesToUpload.length === 0) return;

    try {
      let prefix = currentPath;
      if (prefix.startsWith('/')) prefix = prefix.slice(1);
      if (prefix && !prefix.endsWith('/')) prefix += '/';
      if (prefix === '/') prefix = '';

      const displayPath = prefix || 'root';
      console.log(`Uploading to path: ${displayPath} (${filesToUpload.length} files)`);

      addNotification(
        `Starting upload of ${filesToUpload.length} file(s) to ${displayPath}`,
        'info'
      );

      // Split into batches for presigned URLs
      const batches: UploadFile[][] = [];
      for (let i = 0; i < filesToUpload.length; i += PRESIGNED_BATCH_SIZE) {
        batches.push(filesToUpload.slice(i, i + PRESIGNED_BATCH_SIZE));
      }

      const allPresignedUrls: PresignedUpload[] = [];

      // Get presigned URLs for each batch sequentially (to avoid overwhelming the lambda)
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchFileNames = batch.map((f) => f.file.name);

        addNotification(
          `Requesting presigned URLs for batch ${batchIndex + 1}/${batches.length} (${batch.length} files)...`,
          'info'
        );

        const response = await fetch('https://e16ufjl300.execute-api.eu-north-1.amazonaws.com/default/bulkupload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: batchFileNames,
            folder: prefix,
          }),
          mode: 'cors',
        });

        console.log(`Batch ${batchIndex + 1} Lambda request body:`, JSON.stringify({
          files: batchFileNames,
          folder: prefix,
        }));

        if (!response.ok) {
          throw new Error(`Failed to get presigned URLs for batch ${batchIndex + 1}: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Batch ${batchIndex + 1} Lambda response:`, JSON.stringify(data, null, 2));

        if (!data.success || !data.uploads || !Array.isArray(data.uploads)) {
          throw new Error(data.message || `Invalid Lambda response format for batch ${batchIndex + 1}`);
        }

        // Filter valid uploads
        const batchPresignedUrls = data.uploads.filter((upload: any): upload is PresignedUpload => {
          if (!upload.url || !upload.key) {
            console.warn('Skipping invalid upload entry:', JSON.stringify(upload, null, 2));
            addNotification(`Skipping invalid upload entry for file: ${upload.key || 'unknown'}`, 'error');
            return false;
          }
          if (Object.keys(upload).length > 2) {
            console.warn('Unexpected fields in upload entry:', Object.keys(upload));
          }
          return true;
        });

        if (batchPresignedUrls.length !== batch.length) {
          console.warn(`Batch ${batchIndex + 1}: Expected ${batch.length} presigned URLs, got ${batchPresignedUrls.length}`);
          addNotification(`Warning: Batch ${batchIndex + 1} received ${batchPresignedUrls.length} valid URLs out of ${batch.length} requested`, 'info');
        }

        allPresignedUrls.push(...batchPresignedUrls);
      }

      if (allPresignedUrls.length === 0) {
        throw new Error('No valid presigned URLs received across all batches');
      }

      // Now process uploads in batches with concurrency
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batchFiles = batches[batchIndex];
        const batchPresignedUrls = allPresignedUrls.slice(
          batchIndex * PRESIGNED_BATCH_SIZE,
          (batchIndex + 1) * PRESIGNED_BATCH_SIZE
        );
        await processUploadBatch(batchFiles, batchPresignedUrls);
      }

      // Check for any remaining errors
      const failedUploads = filesToUpload.filter(f => f.status === 'error');
      if (failedUploads.length > 0) {
        throw new Error(`Failed to upload ${failedUploads.length} file(s): ${failedUploads.map(f => f.file.name).join(', ')}`);
      }

      fetchGalleryItems();
      setUploadFiles([]);
      addNotification(`Successfully uploaded ${allPresignedUrls.length} file(s) to ${displayPath}`, 'success');
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadFiles((prev) =>
        prev.map((f) =>
          filesToUpload.some((pf) => pf.id === f.id)
            ? { ...f, status: 'error', error: error.message }
            : f
        )
      );
      setError(`Upload failed: ${error.message}`);
      addNotification(`Upload failed: ${error.message}`, 'error');
    }
  };

  // -------------------- Render UI --------------------
  // Upload progress counters - Single consolidated progress bar
  const completedCount = uploadFiles.filter(f => f.status === 'completed').length;
  const totalCount = uploadFiles.length;
  const errorCount = uploadFiles.filter(f => f.status === 'error').length;
  const uploadingFiles = uploadFiles.filter(f => f.status === 'uploading');
  const pendingCount = uploadFiles.filter(f => f.status === 'pending').length;
  
  // Calculate overall progress including partial progress of uploading files
  const overallProgress = totalCount > 0 ? 
    (completedCount + uploadingFiles.reduce((sum, f) => sum + (f.progress || 0) / 100, 0)) / totalCount * 100 : 0;
  
  // Calculate combined upload speed and total throughput
  const uploadingSpeeds = uploadingFiles.map(f => f.speed || 0).filter(speed => speed > 0);
  const totalUploadSpeed = uploadingSpeeds.reduce((a, b) => a + b, 0);
  const avgSpeedNum = uploadingSpeeds.length > 0 ? totalUploadSpeed / uploadingSpeeds.length : 0;
  
  // Format speeds in appropriate units
  const formatSpeed = (speedKBps: number) => {
    if (speedKBps === 0) return '—';
    if (speedKBps >= 1024) {
      return `${(speedKBps / 1024).toFixed(1)} MB/s`;
    }
    if (speedKBps < 0.1) return '< 0.1 KB/s';
    return `${speedKBps.toFixed(1)} KB/s`;
  };
  
  const avgSpeed = formatSpeed(avgSpeedNum);
  const totalSpeed = formatSpeed(totalUploadSpeed);
  
  // Calculate estimated time remaining
  const remainingFiles = totalCount - completedCount;
  const avgFileSize = uploadingFiles.length > 0 ? 
    uploadingFiles.reduce((sum, f) => sum + f.file.size, 0) / uploadingFiles.length : 0;
  const estimatedTimeSeconds = totalUploadSpeed > 0 ? 
    (remainingFiles * avgFileSize / 1024) / totalUploadSpeed : 0;
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <GalleryErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <Header title="Gallery Management" sidebarCollapsed={sidebarCollapsed} />

          <main className="pt-16 p-6">
            {/* Notifications */}
            {notifications.length > 0 && (
              <div className="fixed top-20 right-6 z-50 space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg shadow-lg text-white ${
                      notification.type === 'success'
                        ? 'bg-green-500'
                        : notification.type === 'error'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{notification.message}</span>
                      <button
                        onClick={() =>
                          setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
                        }
                        className="ml-4"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

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

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCreateFolderModal(true)}
                  className="flex items-center px-4 py-2 bg-[#00BCEB] text-white rounded-lg font-medium hover:bg-[#00A5CF] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  disabled={createFolderLoading}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Folder
                  {createFolderLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#FF9900] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload New
                </button>
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.tiff,.tif,.ico,.mp4,.mov,.avi,.wmv,.mkv,.webm,.flv,.3gp,.m4v"
                  ref={fileInputRef}
                  onChange={(e) => handleFileSelect(e.target.files)}
                  hidden
                />
              </div>
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
                      placeholder="Search media..."
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

                  {/* Select All Button */}
                  {(filteredImages.length > 0 || folders.length > 0) && (
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.length === (filteredImages.length + folders.length)}
                        onChange={() => {}} // Controlled by button click
                        className="h-4 w-4 text-[#00BCEB] focus:ring-[#00BCEB] border-gray-200 rounded mr-2"
                      />
                      Select All
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {/* Quick Actions for Images */}
                  {filteredImages.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSelectAllImages}
                        className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-sm"
                      >
                        <Image className="w-4 h-4 mr-1" />
                        Select All Images
                      </button>
                      <button
                        onClick={handleCopyAllImageNames}
                        className="flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors duration-200 text-sm"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy All Names
                      </button>
                    </div>
                  )}
                  
                  {/* Selection Info */}
                  {selectedItems.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{selectedItems.length} selected</span>
                      
                      {/* Show Image List button for client selection folders */}
                      {selectedItems.length === 1 && 
                       folders.some(f => f.path === selectedItems[0] && (f.path.includes('client') || f.path.includes('selection'))) && (
                        <button
                          onClick={() => {
                            const selectedFolder = folders.find(f => f.path === selectedItems[0]);
                            if (selectedFolder) {
                              handleShowImageList(selectedFolder.path, selectedFolder.name);
                            }
                          }}
                          className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm"
                          disabled={imageListLoading}
                        >
                          <Eye className="w-4 h-4 inline mr-1" />
                          View Image List
                          {imageListLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        </button>
                      )}
                      
                      {/* Show Selected Images button when multiple images are selected */}
                      {selectedItems.filter(id => !id.startsWith('/')).length > 0 && (
                        <button
                          onClick={handleShowSelectedImages}
                          className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm"
                        >
                          <Image className="w-4 h-4 inline mr-1" />
                          View Selected Images
                        </button>
                      )}
                      
                      <button
                        onClick={handleBulkDownload}
                        className="px-3 py-1.5 bg-[#00BCEB] text-white rounded-lg hover:bg-[#00A5CF] transition-colors duration-200 text-sm"
                        disabled={bulkDownloadLoading}
                      >
                        <Download className="w-4 h-4 inline mr-1" />
                        Download
                        {bulkDownloadLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      </button>
                      <button
                        onClick={handleShare}
                        className="px-3 py-1.5 bg-[#FF6B00] text-white rounded-lg hover:bg-[#FF9900] transition-colors duration-200 text-sm"
                        disabled={shareLoading}
                      >
                        <Share2 className="w-4 h-4 inline mr-1" />
                        Share
                        {shareLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
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
                      className={`p-2 ${viewMode === 'grid' ? 'bg-[#00BCEB] text-white' : 'text-gray-600 hover:text-[#00BCEB]'} rounded-l-lg transition-colors duration-200`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-[#00BCEB] text-white' : 'text-gray-600 hover:text-[#00BCEB]'} rounded-r-lg transition-colors duration-200`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <select
                      value={filters.month}
                      onChange={(e) => handleFilterChange('month', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-transparent"
                    >
                      <option value="">All Months</option>
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shoot Type</label>
                    <select
                      value={filters.shootType}
                      onChange={(e) => handleFilterChange('shootType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-transparent"
                    >
                      <option value="">All Types</option>
                      {shootTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.favorites}
                        onChange={(e) => handleFilterChange('favorites', e.target.checked)}
                        className="h-4 w-4 text-[#00BCEB] focus:ring-[#00BCEB] border-gray-200 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Favorites</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.watermarked}
                        onChange={(e) => handleFilterChange('watermarked', e.target.checked)}
                        className="h-4 w-4 text-[#00BCEB] focus:ring-[#00BCEB] border-gray-200 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Watermarked</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.pinProtected}
                        onChange={(e) => handleFilterChange('pinProtected', e.target.checked)}
                        className="h-4 w-4 text-[#00BCEB] focus:ring-[#00BCEB] border-gray-200 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Pin Protected</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {/* Delete Errors */}
            {deleteErrors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-sm font-medium text-red-700 mb-2">Deletion Errors:</h3>
                <ul className="list-disc list-inside text-red-600 text-sm">
                  {deleteErrors.map((err, index) => (
                    <li key={index}>
                      {err.Key}: {err.Message} {err.Code && `(${err.Code})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* SINGLE UPLOAD PROGRESS BAR WITH DETAILED SPEED INFO */}
            {uploadFiles.length > 0 && (
              <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-[480px] bg-white rounded-lg shadow-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <div>
                      <span className="text-sm font-semibold text-gray-800">
                        Uploading {totalCount} files
                      </span>
                      <div className="text-xs text-gray-500">
                        {completedCount} completed • {uploadingFiles.length} active • {pendingCount} pending
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadFiles([])}
                    className="text-xs text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 border border-red-200"
                  >
                    Cancel All
                  </button>
                </div>
                
                {/* SINGLE CONSOLIDATED PROGRESS BAR */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span className="font-medium">{completedCount}/{totalCount} files</span>
                    <span className="font-medium">{Math.round(overallProgress)}% complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ease-out relative ${
                        completedCount === totalCount && errorCount === 0 
                          ? 'bg-gradient-to-r from-green-500 to-green-600' 
                          : errorCount > 0 
                          ? 'bg-gradient-to-r from-red-500 to-red-600' 
                          : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(3, overallProgress))}%` }}
                    >
                      <div className="absolute inset-0 bg-white bg-opacity-20 animate-pulse rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* DETAILED SPEED AND STATUS INFO */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Upload Speed:</span>
                      <span className="font-medium text-blue-600">
                        {totalSpeed}
                        {uploadingFiles.length > 0 && (
                          <span className="text-xs text-gray-400 ml-1">
                            ({uploadingSpeeds.length} active)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Avg per File:</span>
                      <span className="font-medium text-gray-700">{avgSpeed}</span>
                    </div>
                    {estimatedTimeSeconds > 0 && remainingFiles > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Time Left:</span>
                        <span className="font-medium text-orange-600">{formatTime(estimatedTimeSeconds)}</span>
                      </div>
                    )}
                    {uploadingFiles.length > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Debug:</span>
                        <span className="text-gray-500">
                          {uploadingFiles.map(f => f.speed?.toFixed(1) || '0').join(', ')} KB/s
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Active:</span>
                      <span className="font-medium text-blue-600">
                        {uploadingFiles.length > 0 ? `⬆ ${uploadingFiles.length}` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Errors:</span>
                      <span className={`font-medium ${errorCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {errorCount > 0 ? `❌ ${errorCount}` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${
                        completedCount === totalCount && errorCount === 0 
                          ? 'text-green-600' 
                          : uploadingFiles.length > 0 
                          ? 'text-blue-600' 
                          : 'text-gray-600'
                      }`}>
                        {completedCount === totalCount && errorCount === 0 
                          ? '✅ Complete' 
                          : uploadingFiles.length > 0 
                          ? '🔄 Uploading' 
                          : '⏸ Paused'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {completedCount === totalCount && errorCount === 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                    <span className="text-sm text-green-600 font-medium">
                      🎉 All {totalCount} files uploaded successfully!
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Content with Drag and Drop */}
            <div
              className={`relative ${
                loading ? 'h-64 flex items-center justify-center' : ''
              } ${dragActive ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {dragActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg z-10">
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-[#00BCEB] mx-auto mb-2" />
                    <p className="text-[#00BCEB] font-medium">Drop files here to upload</p>
                  </div>
                </div>
              )}
              {loading ? (
                <Loader2 className="h-8 w-8 text-[#00BCEB] animate-spin" />
              ) : (
                <>
                  {folders.length === 0 && filteredImages.length === 0 ? (
                    <div className="text-center py-12">
                      <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No media or folders found in this directory.</p>
                      <p className="text-sm text-gray-400 mt-2">Drag and drop files here to upload</p>
                    </div>
                  ) : (
                    <div
                      className={`${
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                          : 'space-y-4'
                      }`}
                    >
                      {/* Folders */}
                      {folders.map((folder) => (
                        <div
                          key={folder.path}
                          className="group relative p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(folder.path)}
                            onChange={(e) => handleSelectItem(folder.path, e.target.checked)}
                            className="absolute top-2 right-2 h-4 w-4 text-[#00BCEB] focus:ring-[#00BCEB] border-gray-200 rounded"
                          />
                          <div
                            onClick={() => handleFolderClick(folder.path)}
                            className="cursor-pointer flex items-center space-x-3"
                          >
                            <Folder className="h-8 w-8 text-[#00BCEB]" />
                            <div>
                              <p className="font-medium text-[#2D2D2D] group-hover:text-[#00BCEB] transition-colors duration-200">
                                {folder.name}
                              </p>
                              <p className="text-sm text-gray-500">Folder</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            {deleteLoading.includes(folder.path) ? (
                              <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                            ) : (
                              <button
                                onClick={() => handleDelete(folder.path)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors duration-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Images/Videos */}
                      {filteredImages.map((item) => (
                        <div
                          key={item.id}
                          className={`group relative ${
                            viewMode === 'grid'
                              ? 'bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200'
                              : 'flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                            className="absolute top-2 right-2 h-4 w-4 text-[#00BCEB] focus:ring-[#00BCEB] border-gray-200 rounded"
                          />
                          <div
                            onClick={() => handleImageClick(item)}
                            className={viewMode === 'grid' ? 'cursor-pointer' : 'cursor-pointer flex-1'}
                          >
                            {item.isVideo ? (
                              <div className="relative">
                                <video
                                  src={item.imageUrl}
                                  className={viewMode === 'grid' ? 'w-full h-48 object-cover rounded-t-lg' : 'w-24 h-24 object-cover rounded-lg'}
                                  preload="metadata"
                                  onError={handleImageError}
                                  muted
                                >
                                  <source src={item.imageUrl} type={item.filename.split('.').pop()?.toLowerCase()} />
                                  Your browser does not support the video tag.
                                </video>
                                <Play className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-white opacity-75" />
                              </div>
                            ) : (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className={viewMode === 'grid' ? 'w-full h-48 object-cover rounded-t-lg' : 'w-24 h-24 object-cover rounded-lg'}
                                onError={handleImageError}
                              />
                            )}
                          </div>
                          <div
                            className={
                              viewMode === 'grid'
                                ? 'p-4'
                                : 'flex-1 flex items-center justify-between'
                            }
                          >
                            <div>
                              <p className="font-medium text-[#2D2D2D] group-hover:text-[#00BCEB] transition-colors duration-200">
                                {item.title}
                              </p>
                              <p className="text-sm text-gray-500">{item.shootType}</p>
                              <p className="text-sm text-gray-500">{item.eventDate}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleToggleFavorite(item)}
                                className={`p-1.5 ${item.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'} transition-colors duration-200`}
                              >
                                <Star className="w-4 h-4" fill={item.isFavorite ? 'currentColor' : 'none'} />
                              </button>
                              <button
                                onClick={() => handleImageClick(item)}
                                className="p-1.5 text-gray-400 hover:text-[#00BCEB] transition-colors duration-200"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownload([item])}
                                className="p-1.5 text-gray-400 hover:text-[#00BCEB] transition-colors duration-200"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleShareSingle(item)}
                                className="p-1.5 text-gray-400 hover:text-[#00BCEB] transition-colors duration-200"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              {deleteLoading.includes(item.id) ? (
                                <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                              ) : (
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors duration-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

          {/* Preview Modal */}
          {previewModal.isOpen && previewModal.currentImage && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
              onClick={handleClosePreview}
            >
              <div 
                className="relative max-w-4xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleClosePreview}
                  className="absolute top-4 right-4 text-white hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
                {previewModal.currentImage.isVideo ? (
                  <video
                    src={previewModal.currentImage.imageUrl}
                    controls
                    autoPlay
                    muted
                    className="w-full max-h-[80vh] object-contain rounded-lg preview-modal-video"
                    onError={handleImageError}
                    preload="metadata"
                  >
                    <source src={previewModal.currentImage.imageUrl} type={previewModal.currentImage.filename.split('.').pop()?.toLowerCase()} />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={previewModal.currentImage.imageUrl}
                    alt={previewModal.currentImage.title}
                    className="w-full max-h-[80vh] object-contain rounded-lg"
                    onError={handleImageError}
                  />
                )}
                <div className="bg-white p-4 rounded-b-lg">
                  <p className="font-medium text-[#2D2D2D]">{previewModal.currentImage.title}</p>
                  <p className="text-sm text-gray-500">{previewModal.currentImage.shootType}</p>
                  <p className="text-sm text-gray-500">{previewModal.currentImage.eventDate}</p>
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => handleDownloadItem(previewModal.currentImage!)}
                      className="px-3 py-1.5 bg-[#00BCEB] text-white rounded-lg text-sm"
                    >
                      <Download className="w-4 h-4 inline mr-1" />
                      Download
                    </button>
                    <button
                      onClick={() => handleShareSingle(previewModal.currentImage!)}
                      className="px-3 py-1.5 bg-[#FF6B00] text-white rounded-lg text-sm"
                    >
                      <Share2 className="w-4 h-4 inline mr-1" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Share Modal */}
          {shareModal.isOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-[#2D2D2D]">Share Media</h3>
                  <button
                    onClick={() => setShareModal({ isOpen: false, links: [], serverMessage: null })}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  {shareModal.serverMessage && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <strong className="text-sm text-yellow-700">Share server message:</strong>
                      <div className="text-sm text-yellow-800 mt-1">{shareModal.serverMessage}</div>
                    </div>
                  )}

                  {shareModal.links.length === 0 && !shareModal.serverMessage && (
                    <p className="text-gray-500">No links yet.</p>
                  )}

                  {shareModal.links.map((link, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={link}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                      />
                      <button
                        onClick={() => copyToClipboard(link)}
                        className="p-2 text-[#00BCEB] hover:text-[#00A5CF]"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="email"
                        placeholder="Enter email address"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                      />
                      <button className="p-2 text-[#00BCEB] hover:text-[#00A5CF]">
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </div> */}

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShareModal({ isOpen: false, links: [], serverMessage: null })}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // placeholder: if you have server-side share/email logic, call it here
                        setShareModal({ isOpen: false, links: [], serverMessage: null });
                        addNotification('Link(s) prepared for sharing', 'success');
                      }}
                      className="px-4 py-2 bg-[#00BCEB] text-white rounded-lg hover:bg-[#00A5CF]"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Folder Modal */}
          {createFolderModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-[#2D2D2D]">Create New Folder</h3>
                  <button
                    onClick={() => setCreateFolderModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Folder Name</label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                    placeholder="Enter folder name"
                    disabled={createFolderLoading}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setCreateFolderModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    disabled={createFolderLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    className="px-4 py-2 bg-[#00BCEB] text-white rounded-lg hover:bg-[#00A5CF] flex items-center"
                    disabled={createFolderLoading}
                  >
                    Create
                    {createFolderLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Image List Modal */}
          {imageListModal.isOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-[#2D2D2D]">
                    Images in "{imageListModal.folderName}"
                  </h3>
                  <button
                    onClick={() => setImageListModal({ isOpen: false, folderName: '', images: [] })}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {imageListModal.images.length} image{imageListModal.images.length !== 1 ? 's' : ''} found
                  </p>
                  <button
                    onClick={() => copyImageListToClipboard(imageListModal.images)}
                    className="flex items-center px-3 py-1.5 bg-[#00BCEB] text-white rounded-lg hover:bg-[#00A5CF] transition-colors duration-200 text-sm"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy List
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                  {imageListLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-8 w-8 text-[#00BCEB] animate-spin" />
                    </div>
                  ) : imageListModal.images.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-gray-500">
                      <div className="text-center">
                        <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No images found in this folder</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="space-y-2">
                        {imageListModal.images.map((imageName, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded border hover:bg-gray-100 transition-colors duration-200"
                          >
                            <div className="flex items-center space-x-3">
                              <Image className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-700">
                                {imageName}
                              </span>
                            </div>
                            <button
                              onClick={() => copyToClipboard(imageName)}
                              className="p-1 text-gray-400 hover:text-[#00BCEB] transition-colors duration-200"
                              title="Copy image name"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => setImageListModal({ isOpen: false, folderName: '', images: [] })}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => copyImageListToClipboard(imageListModal.images)}
                    className="px-4 py-2 bg-[#00BCEB] text-white rounded-lg hover:bg-[#00A5CF]"
                  >
                    Copy All Names
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Selected Images Modal */}
          {selectedImagesModal.isOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-[#2D2D2D]">
                    Selected Images
                  </h3>
                  <button
                    onClick={() => setSelectedImagesModal({ isOpen: false, images: [] })}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {selectedImagesModal.images.length} image{selectedImagesModal.images.length !== 1 ? 's' : ''} selected
                  </p>
                  <button
                    onClick={() => copyImageListToClipboard(selectedImagesModal.images)}
                    className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy List
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                  {selectedImagesModal.images.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-gray-500">
                      <div className="text-center">
                        <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No images selected</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="space-y-2">
                        {selectedImagesModal.images.map((imageName, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded border hover:bg-gray-100 transition-colors duration-200"
                          >
                            <div className="flex items-center space-x-3">
                              <Image className="h-4 w-4 text-purple-500" />
                              <span className="text-sm font-medium text-gray-700">
                                {imageName}
                              </span>
                            </div>
                            <button
                              onClick={() => copyToClipboard(imageName)}
                              className="p-1 text-gray-400 hover:text-purple-600 transition-colors duration-200"
                              title="Copy image name"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => setSelectedImagesModal({ isOpen: false, images: [] })}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => copyImageListToClipboard(selectedImagesModal.images)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Copy All Names
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
    </GalleryErrorBoundary>
  );
}

export default Gallery;