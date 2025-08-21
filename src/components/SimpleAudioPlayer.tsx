import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, AlertCircle } from "lucide-react";

interface SimpleAudioPlayerProps {
  audioUrl: string;
  label?: string;
}

export default function SimpleAudioPlayer({ audioUrl, label = "Enregistrement audio" }: SimpleAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    console.log("SimpleAudioPlayer - Setting up audio with URL:", audioUrl);
    setIsLoading(true);
    setHasError(false);
  }, [audioUrl]);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        console.log("SimpleAudioPlayer - Pausing audio");
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log("SimpleAudioPlayer - Playing audio");
        audioRef.current.play().catch((error) => {
          console.error("SimpleAudioPlayer - Play error:", error);
          setHasError(true);
        });
      }
    }
  };

  const handleAudioLoad = () => {
    console.log("SimpleAudioPlayer - Audio loaded successfully");
    setIsLoading(false);
    setHasError(false);
  };

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error("SimpleAudioPlayer - Audio error:", e);
    setHasError(true);
    setIsLoading(false);
    setIsPlaying(false);
  };

  const handleAudioPlay = () => {
    console.log("SimpleAudioPlayer - Audio started playing");
    setIsPlaying(true);
  };

  const handleAudioPause = () => {
    console.log("SimpleAudioPlayer - Audio paused");
    setIsPlaying(false);
  };

  const handleAudioEnded = () => {
    console.log("SimpleAudioPlayer - Audio ended");
    setIsPlaying(false);
  };

  if (hasError) {
    return (
      <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
        <span className="text-sm text-destructive">
          Impossible de lire l'enregistrement audio
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={toggleAudio}
        disabled={isLoading}
        className="shrink-0"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4 mr-1" />
        ) : (
          <Play className="h-4 w-4 mr-1" />
        )}
        {isLoading ? "Chargement..." : isPlaying ? "Pause" : "Écouter"}
      </Button>
      
      <Volume2 className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
      
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedData={handleAudioLoad}
        onError={handleAudioError}
        onPlay={handleAudioPlay}
        onPause={handleAudioPause}
        onEnded={handleAudioEnded}
        className="hidden"
        preload="metadata"
      />
    </div>
  );
}