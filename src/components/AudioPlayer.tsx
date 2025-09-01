import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2 } from "lucide-react";

interface AudioPlayerProps {
  readonly audioUrl: string | null;
  readonly onDelete: () => void;
  readonly recordingTime: number;
}

export default function AudioPlayer({ audioUrl, onDelete, recordingTime }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [hasError, setHasError] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    console.log("AudioPlayer - Setting up audio with URL:", audioUrl);

    const handleCanPlay = () => {
      console.log("AudioPlayer - Audio can play");
      setCanPlay(true);
      setHasError(false);
    };

    const handleError = (e: Event) => {
      console.error("AudioPlayer - Audio error:", e);
      console.error("AudioPlayer - Audio URL:", audioUrl);
      console.error("AudioPlayer - Audio element error details:", audio.error);
      setHasError(true);
      setCanPlay(false);
      setIsPlaying(false);
    };

    const handleEnded = () => {
      console.log("AudioPlayer - Audio ended");
      setIsPlaying(false);
    };

    const handleLoadStart = () => {
      console.log("AudioPlayer - Audio load start");
    };

    const handleLoadedData = () => {
      console.log("AudioPlayer - Audio loaded data");
    };

    // Add event listeners
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);

    // Set the source
    audio.src = audioUrl;
    audio.load();

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [audioUrl]);

  const playAudio = async () => {
    const audio = audioRef.current;
    if (!audio || !canPlay) {
      console.log("AudioPlayer - Cannot play: audio not ready", { audio: !!audio, canPlay });
      return;
    }

    try {
      console.log("AudioPlayer - Starting playback");
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("AudioPlayer - Play error:", error);
      setHasError(true);
    }
  };

  const pauseAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log("AudioPlayer - Pausing audio");
    audio.pause();
    setIsPlaying(false);
  };

  if (!audioUrl) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center space-x-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-green-700 font-medium">
            {hasError ? "Erreur audio" : "Enregistrement terminé"}
          </span>
        </div>
        <span className="text-green-600 font-mono">{formatTime(recordingTime)}</span>
      </div>
      
      {hasError && (
        <div className="text-sm text-red-600 text-center">
          Impossible de lire l'audio. Format non supporté ou fichier corrompu.
        </div>
      )}
      
      <div className="flex items-center justify-center space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={isPlaying ? pauseAudio : playAudio}
          disabled={hasError || !canPlay}
          className="flex items-center space-x-2"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>
            {(() => {
              if (isPlaying) return "Pause";
              if (canPlay) return "Écouter";
              return "Chargement...";
            })()}
          </span>
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
      
      <audio
        ref={audioRef}
        className="hidden"
        preload="auto"
        aria-label="Enregistrement audio du signalement"
      >
        <track kind="captions" src="" label="Pas de sous-titres disponibles" />
      </audio>
    </div>
  );
}