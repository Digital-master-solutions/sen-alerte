import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PhotoPreviewProps {
  photoUrl: string | null;
  onDelete: () => void;
  className?: string;
}

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({ 
  photoUrl, 
  onDelete, 
  className = '' 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showFullSize, setShowFullSize] = useState(false);

  const handleImageLoad = () => {
    console.log('PhotoPreview - Image loaded successfully');
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    console.error('PhotoPreview - Image failed to load');
    setIsLoading(false);
    setHasError(true);
  };

  if (!photoUrl) {
    return null;
  }

  return (
    <>
      <div className={`relative ${className}`}>
        {isLoading && (
          <Skeleton className="w-full h-48 rounded-lg" />
        )}
        
        {hasError ? (
          <div className="w-full h-48 bg-muted flex items-center justify-center text-muted-foreground text-sm rounded-lg border">
            Image non disponible
          </div>
        ) : (
          <img 
            src={photoUrl} 
            alt="Photo capturée" 
            className={`w-full h-48 object-cover rounded-lg border transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: isLoading ? 'none' : 'block' }}
          />
        )}
        
        {!isLoading && !hasError && (
          <div className="absolute top-2 right-2 flex space-x-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowFullSize(true)}
              className="bg-white/80 hover:bg-white/90"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="bg-red-500/80 hover:bg-red-500/90"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Full size image modal */}
      {showFullSize && !hasError && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setShowFullSize(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={photoUrl} 
              alt="Photo en taille réelle" 
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowFullSize(false)}
              className="absolute top-4 right-4 bg-white/80 hover:bg-white/90"
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </>
  );
};