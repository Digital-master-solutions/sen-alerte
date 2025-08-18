import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Play, Pause, Volume2, X, ZoomIn } from "lucide-react";
import { getStatusBadge } from "./getStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef, useEffect } from "react";

interface Report {
  id: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  department: string;
  address: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string;
  audio_url?: string;
  anonymous_code?: string;
  assigned_organization_id?: string;
}

interface ReportDetailsDialogProps {
  report: Report;
  onReportSelect: (report: Report) => void;
}

export function ReportDetailsDialog({ report, onReportSelect }: ReportDetailsDialogProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadMedia = async () => {
      // Charger l'URL de la photo depuis le storage
      if (report.photo_url) {
        const { data: photoData } = supabase.storage
          .from('report-photos')
          .getPublicUrl(report.photo_url);
        setPhotoUrl(photoData.publicUrl);
      }

      // Charger l'URL de l'audio depuis le storage
      if (report.audio_url) {
        const { data: audioData } = supabase.storage
          .from('report-audio')
          .getPublicUrl(report.audio_url);
        setAudioUrl(audioData.publicUrl);
      }
    };

    loadMedia();
  }, [report.photo_url, report.audio_url]);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => onReportSelect(report)}>
          <Eye className="h-4 w-4 mr-1" />
          Voir
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du signalement</DialogTitle>
          <DialogDescription>Code: {report.anonymous_code}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Type:</strong> {report.type}
            </div>
            <div>
              <strong>Statut:</strong> {getStatusBadge(report.status)}
            </div>
          </div>
          <div>
            <strong>Description:</strong>
            <p className="mt-1 break-words">{report.description}</p>
          </div>
          {report.address && (
            <div>
              <strong>Adresse:</strong>
              <p className="mt-1 break-words">{report.address}</p>
            </div>
          )}
          {photoUrl && (
            <div>
              <strong>Photo:</strong>
              <div className="mt-2 relative">
                <img
                  src={photoUrl}
                  alt="Signalement"
                  className="rounded-lg max-h-64 w-full object-cover border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setShowImageModal(true)}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={() => setShowImageModal(true)}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {audioUrl && (
            <div>
              <strong>Enregistrement audio:</strong>
              <div className="mt-2 flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={toggleAudio}
                  className="shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 mr-1" />
                  ) : (
                    <Play className="h-4 w-4 mr-1" />
                  )}
                  {isPlaying ? "Pause" : "Écouter"}
                </Button>
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Enregistrement vocal du signalement
                </span>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={handleAudioEnded}
                  className="hidden"
                  preload="metadata"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Modal d'agrandissement d'image */}
      {showImageModal && photoUrl && (
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setShowImageModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <img
                src={photoUrl}
                alt="Signalement - Vue agrandie"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}