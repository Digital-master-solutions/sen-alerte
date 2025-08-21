import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, AlertCircle } from "lucide-react";

interface PhotoPreviewProps {
  photoUrl: string | null;
  onDelete: () => void;
  alt?: string;
}

export default function PhotoPreview({ photoUrl, onDelete, alt = "Photo capturée" }: PhotoPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!photoUrl) return null;

  const handleImageLoad = () => {
    console.log("PhotoPreview - Image loaded successfully");
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error("PhotoPreview - Image load error:", e);
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="w-full h-48 bg-gray-100 rounded-lg border flex items-center justify-center">
          <div className="text-gray-500">Chargement de l'image...</div>
        </div>
      )}
      
      {hasError && (
        <div className="w-full h-48 bg-red-50 rounded-lg border flex flex-col items-center justify-center space-y-2">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <div className="text-red-600 text-sm text-center">
            Impossible d'afficher l'image
          </div>
        </div>
      )}
      
      <img 
        src={photoUrl} 
        alt={alt}
        className={`w-full h-48 object-cover rounded-lg border ${isLoading || hasError ? 'hidden' : 'block'}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      
      {!hasError && (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="absolute top-2 right-2"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}