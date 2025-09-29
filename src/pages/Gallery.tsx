/* Full modified Gallery.tsx — every single line included.
   Changes: simplified share flow to POST-only (no token fallback),
   robust response parsing, clearer errors/logging.
*/

import React, { useState, useEffect, Component, ErrorInfo, useRef } from 'react';
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
} from 'lucide-react';

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

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
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
        const rawTitle = keyParts.pop() || 'Untitled';
        const title = rawTitle.replace(/\.[^/.]+$/, '');
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
  // Try to fetch blob and save — if CORS blocks fetch, fallback to opening url in new tab (user can download from there).
  const fetchBlobOrOpen = async (url: string, filename: string) => {
    try {
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
      const blob = await res.blob();
      saveAs(blob, filename);
      return true;
    } catch (err: any) {
      console.warn('Direct fetch failed (possibly CORS). Falling back to opening URL in new tab.', err);
      // Fallback: open presigned url in new tab/window for user to download directly
      try {
        const newWin = window.open(url, '_blank', 'noopener,noreferrer');
        if (!newWin) {
          addNotification('Could not open new tab for download — popup blocked.', 'error');
          return false;
        }
        addNotification(`Opened download link in new tab for ${filename}`, 'info');
        return true;
      } catch (e) {
        console.error('Fallback open failed', e);
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
    const filename = `${item.title}${item.isVideo ? '.mp4' : '.jpg'}`;
    addNotification(`Starting download: ${filename}`, 'info');
    await fetchBlobOrOpen(item.imageUrl, filename);
  };

  // Bulk download selected items/folders
  const handleBulkDownload = async () => {
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
      fileList.push({ url: it.imageUrl, filename: `${it.title}${it.isVideo ? '.mp4' : '.jpg'}` });
    }

    // for each selected folder, call your getallimages endpoint to list files inside and push into fileList
    for (const folder of selectedFolders) {
      try {
        // Use the same getallimages lambda to list files under a prefix
        let prefix = folder.path;
        if (prefix.startsWith('/')) prefix = prefix.slice(1);
        if (!prefix.endsWith('/')) prefix += '/';

        const resp = await fetch(
          `https://a9017femoa.execute-api.eu-north-1.amazonaws.com/default/getallimages?prefix=${encodeURIComponent(prefix)}`,
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
            const name = file.name || (file.key ? file.key.split('/').pop() : 'unnamed');
            if (url) {
              fileList.push({ url, filename: `${folder.name}/${name}` });
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
  // const generateShareableLinks = async (forItemIds: string[]) => {
  //   const folderPaths = forItemIds.filter((id) => id.startsWith('/'));
  //   const itemIds = forItemIds.filter((id) => !id.startsWith('/'));
  //   const links: string[] = [];

  //   // Items that already have direct URLs
  //   if (itemIds.length > 0) {
  //     const itemsToShare = items.filter((it) => itemIds.includes(it.id));
  //     const directUrls = itemsToShare.map((it) => it.imageUrl).filter(Boolean) as string[];
  //     const missingKeys = itemsToShare.filter((it) => !it.imageUrl).map((it) => it.key || it.id);

  //     if (directUrls.length > 0) {
  //       links.push(...directUrls);
  //     }
  //     if (missingKeys.length > 0) {
  //       // request presigned urls for these keys
  //       const created = await requestShareLinksFromServer(missingKeys);
  //       links.push(...created);
  //     }
  //   }

  //   if (folderPaths.length > 0) {
  //     // convert to prefixes expected by backend (remove leading slash, ensure trailing slash)
  //     const prefixes = folderPaths.map((p) => (p.startsWith('/') ? p.slice(1) : p)).map((p) => (p.endsWith('/') ? p : `${p}/`));

  //     // Server expects keys array: we will pass prefixes and metadata indicating folder share
  //     try {
  //       const created = await requestShareLinksFromServer(prefixes, { type: 'folder' });
  //       links.push(...created);
  //     } catch (err) {
  //       // rethrow to allow caller show message, handled below
  //       throw err;
  //     }
  //   }

  //   return links;
  // };

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

  try {
    addNotification('Generating share link(s)...', 'info');
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
  }
};

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
    try {
      // Check if this is a client selection folder
      if (!folderPath.includes('client') && !folderPath.includes('selection')) {
        addNotification('This feature is only available for client selection folders', 'info');
        return;
      }

      addNotification('Loading image list...', 'info');
      
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
    }
  };

  // -------------------- Upload handlers --------------------
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = Array.from(selectedFiles)
      .filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'))
      .map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: 'pending' as const,
      }));

    if (newFiles.length === 0) {
      setError('No valid image or video files selected');
      addNotification('No valid image or video files selected', 'error');
      return;
    }

    setUploadFiles(newFiles);
    startUpload(newFiles);
  };

  const startUpload = async (filesToUpload: UploadFile[]) => {
    if (filesToUpload.length === 0) return;

    try {
      let prefix = currentPath;
      if (prefix.startsWith('/')) prefix = prefix.slice(1);
      if (prefix && !prefix.endsWith('/')) prefix += '/';
      if (prefix === '/') prefix = '';

      const displayPath = prefix || 'root';
      console.log(`Uploading to path: ${displayPath}`);

      addNotification(
        `Starting upload of ${filesToUpload.length} file(s) to ${displayPath}`,
        'info'
      );

      // Call Lambda to get presigned URLs
      const response = await fetch('https://e16ufjl300.execute-api.eu-north-1.amazonaws.com/default/bulkupload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: filesToUpload.map((f) => f.file.name),
          folder: prefix,
        }),
        mode: 'cors',
      });

      console.log('Lambda request body:', JSON.stringify({
        files: filesToUpload.map((f) => f.file.name),
        folder: prefix,
      }));

      if (!response.ok) {
        throw new Error(`Failed to get presigned URLs: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Lambda response:', JSON.stringify(data, null, 2));

      if (!data.success || !data.uploads || !Array.isArray(data.uploads)) {
        throw new Error(data.message || 'Invalid Lambda response format');
      }

      // Filter valid uploads
      const presignedUrls = data.uploads.filter((upload: any) => {
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

      // Verify expected keys
      const expectedKeys = filesToUpload.map((f) => `${prefix}${f.file.name}`);
      const receivedKeys = presignedUrls.map((u: any) => u.key);
      console.log('Expected S3 keys:', expectedKeys);
      console.log('Received S3 keys:', receivedKeys);

      if (presignedUrls.length !== filesToUpload.length) {
        console.warn(`Expected ${filesToUpload.length} presigned URLs, got ${presignedUrls.length}`);
        addNotification(`Warning: Received ${presignedUrls.length} valid URLs out of ${filesToUpload.length} requested`, 'info');
      }

      if (presignedUrls.length === 0) {
        throw new Error('No valid presigned URLs received');
      }

      // Upload each file using presigned URLs
      const failedUploads: string[] = [];
      for (let i = 0; i < Math.min(filesToUpload.length, presignedUrls.length); i++) {
        const file = filesToUpload[i];
        const { url, key } = presignedUrls[i];

        console.log(`Uploading file: ${file.file.name} to S3 key: ${key}`);
        console.log(`Presigned URL: ${url}`);

        setUploadFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'uploading', progress: 0 } : f))
        );

        try {
          const uploadResponse = await fetch(url, {
            method: 'PUT',
            body: file.file,
            headers: { 'Content-Type': file.file.type },
            // don't set mode:'no-cors' - that would make response opaque and success-check impossible
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            let errorMessage = `Failed to upload ${file.file.name}: ${uploadResponse.status} ${uploadResponse.statusText}`;
            if (uploadResponse.status === 403) {
              errorMessage += ' - Check S3 permissions or Content-Type mismatch';
            }
            throw new Error(`${errorMessage} - ${errorText}`);
          }

          setUploadFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f))
          );
        } catch (err: any) {
          console.error(`Upload failed for ${file.file.name}:`, err);
          failedUploads.push(file.file.name);
          setUploadFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, status: 'error', error: err.message } : f))
          );
        }
      }

      if (failedUploads.length > 0) {
        throw new Error(`Failed to upload ${failedUploads.length} file(s): ${failedUploads.join(', ')}`);
      }

      fetchGalleryItems();
      setUploadFiles([]);
      addNotification(`Successfully uploaded ${presignedUrls.length} file(s) to ${displayPath}`, 'success');
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
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Folder
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload New
                </button>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
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
                        >
                          <Eye className="w-4 h-4 inline mr-1" />
                          View Image List
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

            {/* Upload Progress */}
            {uploadFiles.length > 0 && (
              <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Uploading Files</h3>
                <div className="space-y-2">
                  {uploadFiles.map((file) => (
                    <div key={file.id} className="flex items-center space-x-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">{file.file.name}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${
                              file.status === 'error'
                                ? 'bg-red-500'
                                : file.status === 'completed'
                                ? 'bg-green-500'
                                : 'bg-[#00BCEB]'
                            }`}
                            style={{ width: `${file.progress}%` }}
                          ></div>
                        </div>
                        {file.status === 'error' && (
                          <p className="text-xs text-red-500 mt-1">{file.error}</p>
                        )}
                      </div>
                      {file.status === 'uploading' && (
                        <Loader2 className="w-4 h-4 text-[#00BCEB] animate-spin" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 text-[#00BCEB] animate-spin" />
              </div>
            ) : (
              <>
                {folders.length === 0 && filteredImages.length === 0 ? (
                  <div className="text-center py-12">
                    <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No media or folders found in this directory.</p>
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
                                onError={handleImageError}
                                controls={false}
                              />
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
          </main>

          {/* Preview Modal */}
          {previewModal.isOpen && previewModal.currentImage && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div className="relative max-w-4xl w-full">
                <button
                  onClick={() => setPreviewModal({ isOpen: false, currentImage: null })}
                  className="absolute top-4 right-4 text-white hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
                {previewModal.currentImage.isVideo ? (
                  <video
                    src={previewModal.currentImage.imageUrl}
                    controls
                    className="w-full max-h-[80vh] object-contain rounded-lg"
                    onError={handleImageError}
                  />
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
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setCreateFolderModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    className="px-4 py-2 bg-[#00BCEB] text-white rounded-lg hover:bg-[#00A5CF]"
                  >
                    Create
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
                  {imageListModal.images.length === 0 ? (
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
        </div>
      </div>
    </GalleryErrorBoundary>
  );
}

export default Gallery;
