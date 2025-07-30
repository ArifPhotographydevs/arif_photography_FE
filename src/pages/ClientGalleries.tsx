import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Camera, 
  Eye, 
  Heart, 
  MessageCircle, 
  Edit3, 
  Download, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

interface Gallery {
  id: string;
  title: string;
  shootType: string;
  eventDate: string;
  coverImage: string;
  imageCount: number;
  isNew: boolean;
}

interface GalleryImage {
  id: string;
  url: string;
  title: string;
  isFavorited: boolean;
  comments: number;
}

function ClientGalleries() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    shootType: '',
    month: ''
  });
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Mock galleries data
  const [galleries] = useState<Gallery[]>([
    {
      id: '1',
      title: 'Sarah & John Wedding',
      shootType: 'Wedding',
      eventDate: '2024-03-15',
      coverImage: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400',
      imageCount: 150,
      isNew: true
    },
    {
      id: '2',
      title: 'Pre-Wedding Beach Session',
      shootType: 'Pre-Wedding',
      eventDate: '2024-02-28',
      coverImage: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400',
      imageCount: 85,
      isNew: false
    },
    {
      id: '3',
      title: 'Maternity Photoshoot',
      shootType: 'Maternity',
      eventDate: '2024-02-10',
      coverImage: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=400',
      imageCount: 45,
      isNew: false
    }
  ]);

  // Mock gallery images
  const [galleryImages] = useState<GalleryImage[]>([
    {
      id: '1',
      url: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=600',
      title: 'Ceremony Moments',
      isFavorited: true,
      comments: 2
    },
    {
      id: '2',
      url: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=600',
      title: 'First Dance',
      isFavorited: false,
      comments: 0
    },
    {
      id: '3',
      url: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=600',
      title: 'Ring Exchange',
      isFavorited: true,
      comments: 1
    },
    {
      id: '4',
      url: 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=600',
      title: 'Reception Joy',
      isFavorited: false,
      comments: 3
    },
    {
      id: '5',
      url: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=600',
      title: 'Couple Portrait',
      isFavorited: true,
      comments: 0
    },
    {
      id: '6',
      url: 'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg?auto=compress&cs=tinysrgb&w=600',
      title: 'Celebration',
      isFavorited: false,
      comments: 1
    }
  ]);

  const shootTypes = ['Wedding', 'Pre-Wedding', 'Maternity', 'Corporate', 'Portrait'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const filteredGalleries = galleries.filter(gallery => {
    const eventDate = new Date(gallery.eventDate);
    const galleryMonth = eventDate.toLocaleString('default', { month: 'long' });
    
    const matchesSearch = !searchTerm || 
      gallery.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesShootType = !filters.shootType || gallery.shootType === filters.shootType;
    const matchesMonth = !filters.month || galleryMonth === filters.month;
    
    return matchesSearch && matchesShootType && matchesMonth;
  });

  const handleViewGallery = (gallery: Gallery) => {
    setSelectedGallery(gallery);
  };

  const handleImageClick = (image: GalleryImage) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedImage) return;
    
    const currentIndex = galleryImages.findIndex(img => img.id === selectedImage.id);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : galleryImages.length - 1;
    } else {
      newIndex = currentIndex < galleryImages.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedImage(galleryImages[newIndex]);
  };

  const handleImageAction = (action: string, imageId: string) => {
    // Simulate image actions
    console.log(`${action} action for image ${imageId}`);
  };

  if (selectedGallery) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Gallery Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => setSelectedGallery(null)}
              className="flex items-center text-cyan-600 hover:text-cyan-700 mb-4 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Galleries
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedGallery.title}</h1>
              <div className="flex items-center space-x-4 mt-2 text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(selectedGallery.eventDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="flex items-center">
                  <Camera className="h-4 w-4 mr-2" />
                  {selectedGallery.imageCount} photos
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Grid */}
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages.map((image) => (
              <div
                key={image.id}
                className="relative group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => handleImageClick(image)}
              >
                <div className="aspect-square">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageAction('favorite', image.id);
                      }}
                      className={`p-2 rounded-full transition-colors duration-200 ${
                        image.isFavorited
                          ? 'bg-red-500 text-white'
                          : 'bg-white text-gray-600 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${image.isFavorited ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageAction('comment', image.id);
                      }}
                      className="p-2 bg-white text-gray-600 rounded-full hover:text-cyan-600 transition-colors duration-200"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageAction('edit', image.id);
                      }}
                      className="p-2 bg-white text-gray-600 rounded-full hover:text-orange-600 transition-colors duration-200"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageAction('download', image.id);
                      }}
                      className="p-2 bg-white text-gray-600 rounded-full hover:text-green-600 transition-colors duration-200"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Favorite indicator */}
                {image.isFavorited && (
                  <div className="absolute top-2 right-2">
                    <Heart className="h-5 w-5 text-red-500 fill-current" />
                  </div>
                )}

                {/* Comments indicator */}
                {image.comments > 0 && (
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs flex items-center">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {image.comments}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Image Modal */}
        {showImageModal && selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl w-full max-h-full">
              {/* Close Button */}
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Navigation Buttons */}
              <button
                onClick={() => navigateImage('prev')}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors duration-200"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => navigateImage('next')}
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
                      onClick={() => handleImageAction('favorite', selectedImage.id)}
                      className={`flex items-center space-x-1 ${
                        selectedImage.isFavorited ? 'text-red-500' : 'text-white hover:text-red-500'
                      } transition-colors duration-200`}
                    >
                      <Heart className={`h-5 w-5 ${selectedImage.isFavorited ? 'fill-current' : ''}`} />
                      <span className="text-sm">{selectedImage.isFavorited ? 'Favorited' : 'Add to Favorites'}</span>
                    </button>
                    <button
                      onClick={() => handleImageAction('comment', selectedImage.id)}
                      className="flex items-center space-x-1 text-white hover:text-cyan-400 transition-colors duration-200"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span className="text-sm">Comment ({selectedImage.comments})</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleImageAction('edit', selectedImage.id)}
                      className="flex items-center space-x-1 text-white hover:text-orange-400 transition-colors duration-200"
                    >
                      <Edit3 className="h-5 w-5" />
                      <span className="text-sm">Request Edit</span>
                    </button>
                    <button
                      onClick={() => handleImageAction('download', selectedImage.id)}
                      className="flex items-center space-x-1 text-white hover:text-green-400 transition-colors duration-200"
                    >
                      <Download className="h-5 w-5" />
                      <span className="text-sm">Download</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Galleries</h1>
          <p className="text-gray-600">Browse and manage your photo collections</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by project or album title"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {/* Shoot Type Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Camera className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={filters.shootType}
                onChange={(e) => handleFilterChange('shootType', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">All Shoot Types</option>
                {shootTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">All Months</option>
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Galleries Grid */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGalleries.map((gallery) => (
            <div
              key={gallery.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              {/* Album Cover */}
              <div className="relative aspect-video">
                <img
                  src={gallery.coverImage}
                  alt={gallery.title}
                  className="w-full h-full object-cover"
                />
                {gallery.isNew && (
                  <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    New
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
                  {gallery.imageCount} photos
                </div>
              </div>

              {/* Album Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{gallery.title}</h3>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Camera className="h-4 w-4 mr-1" />
                    {gallery.shootType}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(gallery.eventDate).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleViewGallery(gallery)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors duration-200"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Album
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredGalleries.length === 0 && (
          <div className="text-center py-12">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No galleries found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientGalleries;