import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Trash2, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';

interface AudioPlayerProps {
  audioUrl: string | null;
  onDelete: () => void;
  duration?: string;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioUrl, 
  onDelete, 
  duration, 
  className = '' 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    console.log('AudioPlayer - Audio URL changed:', audioUrl);
    if (audioUrl && audioRef.current) {
      const audio = audioRef.current;
      setIsLoading(true);
      setHasError(false);
      
      // Reset audio source
      audio.src = audioUrl;
      audio.load();
    }
  }, [audioUrl]);

  const handleLoadedData = () => {
    console.log('AudioPlayer - Audio loaded successfully');
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = (e: any) => {
    console.error('AudioPlayer - Audio error:', e);
    setIsLoading(false);
    setHasError(true);
    setIsPlaying(false);
    toast.error('Erreur lors du chargement de l\'audio');
  };

  const handleCanPlay = () => {
    console.log('AudioPlayer - Audio can play');
    setIsLoading(false);
  };

  const togglePlayPause = async () => {
    if (!audioRef.current || !audioUrl) {
      console.warn('AudioPlayer - No audio element or URL');
      return;
    }

    try {
      if (isPlaying) {
        console.log('AudioPlayer - Pausing audio');
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log('AudioPlayer - Playing audio');
        // Ensure volume is set correctly
        audioRef.current.volume = isMuted ? 0 : volume;
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('AudioPlayer - Play/pause error:', error);
      toast.error('Erreur lors de la lecture audio');
      setIsPlaying(false);
    }
  };

  const handleEnded = () => {
    console.log('AudioPlayer - Audio ended');
    setIsPlaying(false);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      audioRef.current.volume = newMuted ? 0 : volume;
    }
  };

  if (!audioUrl) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-center space-x-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-green-700 font-medium">
            {hasError ? 'Erreur audio' : isLoading ? 'Chargement...' : 'Enregistrement terminé'}
          </span>
        </div>
        {duration && (
          <span className="text-green-600 font-mono">{duration}</span>
        )}
      </div>
      
      <div className="flex items-center justify-center space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={togglePlayPause}
          disabled={isLoading || hasError}
          className="flex items-center space-x-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>
            {isLoading ? 'Chargement...' : isPlaying ? 'Pause' : hasError ? 'Erreur' : 'Écouter'}
          </span>
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={toggleMute}
          disabled={isLoading || hasError}
          className="flex items-center space-x-2"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={onDelete}
          className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          <span>Supprimer</span>
        </Button>
      </div>
      
      {/* Audio element with detailed event handling */}
      <audio
        ref={audioRef}
        onLoadedData={handleLoadedData}
        onError={handleError}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        preload="metadata"
        className="hidden"
      />
    </div>
  );
};