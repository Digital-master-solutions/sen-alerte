import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useMobilePermissions } from '@/hooks/useMobilePermissions';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileCameraCaptureProps {
  onCapture: (file: File, previewUrl: string) => void;
  onClose: () => void;
}

export default function MobileCameraCapture({ onCapture, onClose }: MobileCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const { permissions, requestCameraPermission } = useMobilePermissions();
  const isMobile = useIsMobile();

  const startStream = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: isMobile ? 720 : 1280 },
          height: { ideal: isMobile ? 480 : 720 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Camera stream error:', error);
      toast.error("Impossible de démarrer la caméra");
    }
  };

  useEffect(() => {
    const initCamera = async () => {
      if (permissions.camera === 'granted') {
        await startStream();
      } else if (permissions.camera === 'unknown') {
        const granted = await requestCameraPermission();
        if (granted) {
          await startStream();
        }
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [permissions.camera, facingMode, requestCameraPermission]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const previewUrl = URL.createObjectURL(blob);
          onCapture(file, previewUrl);
          
          // Add haptic feedback on mobile
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }
          
          toast.success("Photo capturée!");
        }
      }, 'image/jpeg', 0.85);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/20 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </Button>
        
        <h2 className="text-white font-medium">Prendre une photo</h2>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={switchCamera}
          className="text-white hover:bg-white/20"
          disabled={!isStreaming}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Démarrage de la caméra...</p>
            </div>
          </div>
        )}

        {/* Capture overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Grid overlay for better composition */}
          <div className="absolute inset-4 border border-white/30">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-white/20" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/20 backdrop-blur-sm">
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleCapture}
            disabled={!isStreaming}
            className="w-16 h-16 rounded-full bg-white text-black hover:bg-gray-100 disabled:opacity-50"
          >
            <Camera className="h-6 w-6" />
          </Button>
        </div>
        
        <p className="text-center text-white/70 text-sm mt-4">
          Appuyez pour capturer
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}