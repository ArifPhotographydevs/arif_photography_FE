import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Heart, 
  Download, 
  MessageCircle, 
  Edit3, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  User,
  Send,
  Check,
  AlertCircle
} from 'lucide-react';

interface GalleryImage {
  id: string;
  url: string;
  title: string;
  isFavorited: boolean;
  isWatermarked: boolean;
}

interface GalleryData {
  id: string;
  title: string;
  clientName: string;
  eventDate: string;
  coverImage: string;
  message: string;
  pin: string;
  allowDownload: boolean;
  allowComments: boolean;
  allowEditRequests: boolean;
  images: GalleryImage[];
}

function ClientGallery() {
  const { galleryId } = useParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [editRequestText, setEditRequestText] = useState('');
  const [selectedImageForAction, setSelectedImageForAction] = useState<GalleryImage | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Mock gallery data
  const [galleryData] = useState<GalleryData>({
    id: galleryId || '1',
    title: 'Sarah & John Wedding Gallery',
    clientName: 'Sarah Johnson',
    eventDate: '2024-03-15',
    coverImage: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
    message: 'Your wedding gallery is ready! 💫',
    pin: '1234',
    allowDownload: true,
    allowComments: true,
    allowEditRequests: true,
    images: [
      {
        id: '1',
        url: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=600',
        title: 'Wedding Ceremony',
        isFavorited: false,
        isWatermarked: true
      },
      {
        id: '2',
        url: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=600',
        title: 'First Dance',
        isFavorited: true,
        isWatermarked: true
      },
      {
        id: '3',
        url: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=600',
        title: 'Ring Exchange',
        isFavorited: false,
        isWatermarked: true
      },
      {
        id: '4',
        url: 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=600',
        title: 'Reception Party',
        isFavorited: false,
        isWatermarked: true
      },
      {
        id: '5',
        url: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=600',
        title: 'Couple Portrait',
        isFavorited: true,
        isWatermarked: true
      },
      {
        id: '6',
        url: 'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg?auto=compress&cs=tinysrgb&w=600',
        title: 'Wedding Cake',
        isFavorited: false,
        isWatermarked: true
      }
    ]
  });

  const [images, setImages] = useState(galleryData.images);

  useEffect(() => {
    // Check if already authenticated (could be stored in localStorage)
    const storedAuth = localStorage.getItem(`gallery_auth_${galleryId}`);
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, [galleryId]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }

    setIsLoading(true);
    setPinError('');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (pin === galleryData.pin) {
      setIsAuthenticated(true);
      localStorage.setItem(`gallery_auth_${galleryId}`, 'true');
    } else {
      setPinError('Incorrect PIN. Please try again.');
    }
    setIsLoading(false);
  };

  const toggleFavorite = (imageId: string) => {
    setImages(prev => 
      prev.map(img => 
        img.id === imageId ? { ...img, isFavorited: !img.isFavorited } : img
      )
    );
    showToastMessage('Favorite updated!');
  };

  const handleDownload = (image: GalleryImage) => {
    if (!galleryData.allowDownload) return;
    
    // Simulate download
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `${image.title}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToastMessage('Download started!');
  };

  const openCommentModal = (image: GalleryImage) => {
    if (!galleryData.allowComments) return;
    setSelectedImageForAction(image);
    setShowCommentModal(true);
  };

  const openEditModal = (image: GalleryImage) => {
    if (!galleryData.allowEditRequests) return;
    setSelectedImageForAction(image);
    setShowEditModal(true);
  };

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      // Simulate comment submission
      setShowCommentModal(false);
      setCommentText('');
      setSelectedImageForAction(null);
      showToastMessage('Comment submitted successfully!');
    }
  };

  const handleEditRequestSubmit = () => {
    if (editRequestText.trim()) {
      // Simulate edit request submission
      setShowEditModal(false);
      setEditRequestText('');
      setSelectedImageForAction(null);
      showToastMessage('Edit request submitted successfully!');
    }
  };

  const openLightbox = (image: GalleryImage) => {
    setSelectedImage(image);
    setShowLightbox(true);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (!selectedImage) return;
    
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    } else {
      newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedImage(images[newIndex]);
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // PIN Access Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            {/* Lock Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#00BCEB]/10 rounded-full mb-6">
              <Lock className="h-8 w-8 text-[#00BCEB]" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-[#2D2D2D] mb-2">Gallery Access</h1>
            <p className="text-gray-600 mb-6">Enter your 4-digit PIN to view your gallery</p>

            {/* PIN Form */}
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPin(value);
                    setPinError('');
                  }}
                  className="w-full px-4 py-3 bg-[#F5F7FA] border border-gray-200 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  placeholder="••••"
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#00BCEB] transition-colors duration-200"
                >
                  {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {pinError && (
                <div className="flex items-center justify-center text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {pinError}
                </div>
              )}

              <button
                type="submit"
                disabled={pin.length !== 4 || isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  pin.length === 4 && !isLoading
                    ? 'bg-[#00BCEB] text-white hover:bg-[#00A5CF] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Access Gallery'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main Gallery View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Cover Image */}
            <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden">
              <img
                src={galleryData.coverImage}
                alt="Gallery Cover"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Gallery Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2">{galleryData.title}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <div className="flex items-center text-gray-600">
                  <User className="h-5 w-5 mr-2" />
                  {galleryData.clientName}
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-2" />
                  {new Date(galleryData.eventDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <p className="text-lg text-[#00BCEB] font-medium">{galleryData.message}</p>
              <p className="text-gray-600 mt-2">{images.length} photos • {images.filter(img => img.isFavorited).length} favorites</p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Grid */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {/* Image */}
              <div className="aspect-square relative cursor-pointer" onClick={() => openLightbox(image)}>
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2">
                    {/* Favorite */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(image.id);
                      }}
                      className={`p-2 rounded-full transition-colors duration-200 ${
                        image.isFavorited
                          ? 'bg-[#FF6B00] text-white'
                          : 'bg-white text-gray-600 hover:text-[#FF6B00]'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${image.isFavorited ? 'fill-current' : ''}`} />
                    </button>

                    {/* Download */}
                    {galleryData.allowDownload && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(image);
                        }}
                        className="p-2 bg-white text-gray-600 rounded-full hover:text-[#00BCEB] transition-colors duration-200"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}

                    {/* Comment */}
                    {galleryData.allowComments && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCommentModal(image);
                        }}
                        className="p-2 bg-white text-gray-600 rounded-full hover:text-[#00BCEB] transition-colors duration-200"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    )}

                    {/* Edit Request */}
                    {galleryData.allowEditRequests && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(image);
                        }}
                        className="p-2 bg-white text-gray-600 rounded-full hover:text-[#FF6B00] transition-colors duration-200"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Favorite Heart (always visible if favorited) */}
                {image.isFavorited && (
                  <div className="absolute top-2 right-2">
                    <Heart className="h-5 w-5 text-[#FF6B00] fill-current" />
                  </div>
                )}
              </div>

              {/* Image Title */}
              <div className="p-3">
                <p className="text-sm font-medium text-[#2D2D2D] truncate">{image.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full max-h-full">
            {/* Close Button */}
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation Buttons */}
            <button
              onClick={() => navigateLightbox('prev')}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors duration-200"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => navigateLightbox('next')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors duration-200"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Image */}
            <div className="flex items-center justify-center h-full">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Image Info */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold">{selectedImage.title}</h3>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleFavorite(selectedImage.id)}
                    className={`flex items-center space-x-1 ${
                      selectedImage.isFavorited ? 'text-[#FF6B00]' : 'text-white hover:text-[#FF6B00]'
                    } transition-colors duration-200`}
                  >
                    <Heart className={`h-5 w-5 ${selectedImage.isFavorited ? 'fill-current' : ''}`} />
                    <span className="text-sm">{selectedImage.isFavorited ? 'Favorited' : 'Add to Favorites'}</span>
                  </button>
                </div>
                {galleryData.allowDownload && (
                  <button
                    onClick={() => handleDownload(selectedImage)}
                    className="flex items-center space-x-1 text-white hover:text-[#00BCEB] transition-colors duration-200"
                  >
                    <Download className="h-5 w-5" />
                    <span className="text-sm">Download</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && selectedImageForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[#2D2D2D]">Add Comment</h3>
                <button
                  onClick={() => setShowCommentModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <img
                  src={selectedImageForAction.url}
                  alt={selectedImageForAction.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <p className="text-sm font-medium text-[#2D2D2D] mt-2">{selectedImageForAction.title}</p>
              </div>

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200 resize-none"
                placeholder="Enter your comment about this photo..."
              />

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCommentModal(false)}
                  className="px-4 py-2 text-[#2D2D2D] bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim()}
                  className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    commentText.trim()
                      ? 'bg-[#FF6B00] text-white hover:bg-[#e55a00]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Request Modal */}
      {showEditModal && selectedImageForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[#2D2D2D]">Request Edit</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <img
                  src={selectedImageForAction.url}
                  alt={selectedImageForAction.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <p className="text-sm font-medium text-[#2D2D2D] mt-2">{selectedImageForAction.title}</p>
              </div>

              <textarea
                value={editRequestText}
                onChange={(e) => setEditRequestText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200 resize-none"
                placeholder="Describe what changes you'd like to see..."
              />

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-[#2D2D2D] bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditRequestSubmit}
                  disabled={!editRequestText.trim()}
                  className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    editRequestText.trim()
                      ? 'bg-[#FF6B00] text-white hover:bg-[#e55a00]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center">
            <Check className="h-4 w-4 mr-2" />
            <p className="font-medium">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientGallery;