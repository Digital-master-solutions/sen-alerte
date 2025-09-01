import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useMobilePermissions } from '@/hooks/useMobilePermissions';

interface MobileAudioRecorderProps {
  onRecordingComplete: (file: File, audioUrl: string) => void;
  onClose: () => void;
}

export default function MobileAudioRecorder({ onRecordingComplete, onClose }: MobileAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { permissions, requestMicrophonePermission } = useMobilePermissions();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      if (permissions.microphone !== 'granted') {
        const granted = await requestMicrophonePermission();
        if (!granted) return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      // Check MediaRecorder support and choose best format
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        setRecordedBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        stream.getTracks().forEach(track => track.stop());
        
        // Add haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      streamRef.current = stream;
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success("Enregistrement démarré");

    } catch (error) {
      console.error('Recording error:', error);
      toast.error("Impossible de démarrer l'enregistrement");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      toast.success("Enregistrement terminé");
    }
  };

  const playRecording = () => {
    if (audioUrl && !isPlaying) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.play();
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
      };
    } else if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setRecordedBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const confirmRecording = () => {
    if (recordedBlob && audioUrl) {
      let extension = 'webm'; // default
      if (recordedBlob.type.includes('mp4')) {
        extension = 'mp4';
      } else if (recordedBlob.type.includes('ogg')) {
        extension = 'ogg';
      }
      
      const file = new File([recordedBlob], `audio-${Date.now()}.${extension}`, { 
        type: recordedBlob.type 
      });
      
      onRecordingComplete(file, audioUrl);
      toast.success("Audio ajouté au signalement");
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Ne pas révoquer l'URL ici car elle est utilisée par le composant parent
      // La révocation sera gérée par le composant parent (Report.tsx)
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Enregistrement audio</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Recording Status */}
        <div className="text-center mb-8">
          {isRecording && (
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-600 font-medium">Enregistrement...</span>
            </div>
          )}
          
          <div className="text-3xl font-mono font-bold text-gray-900 mb-2">
            {formatTime(recordingTime)}
          </div>
          
          {recordingTime > 0 && !isRecording && (
            <p className="text-sm text-gray-600">
              Enregistrement terminé
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {!recordedBlob ? (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-16 h-16 rounded-full ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isRecording ? (
                  <Square className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Playback Controls */}
              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={playRecording}
                  className="h-12 px-6"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isPlaying ? 'Pause' : 'Écouter'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={deleteRecording}
                  className="h-12 px-6 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>

              {/* Confirm Button */}
              <Button
                onClick={confirmRecording}
                className="w-full h-12 bg-green-600 hover:bg-green-700"
              >
                Utiliser cet enregistrement
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {!recordedBlob 
              ? "Appuyez sur le microphone pour commencer"
              : "Écoutez votre enregistrement avant de confirmer"
            }
          </p>
        </div>
      </div>
    </div>
  );
}