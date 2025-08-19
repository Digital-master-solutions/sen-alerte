import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { MapPin, Upload, Mic, Crosshair, Camera, Image, Square, Play, Pause, Trash2 } from "lucide-react";
import SuccessAnimation from "@/components/SuccessAnimation";
import LoadingSpinner from "@/components/LoadingSpinner";

const schema = z.object({
  description: z.string().min(10, "Décrivez le problème (min 10 caractères)"),
  type: z.string().min(1, "Choisissez une catégorie"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  photo: z.instanceof(File).optional(),
  audio: z.instanceof(File).optional(),
  anonymous_name: z.string().min(2, "Le nom complet est obligatoire"),
  anonymous_phone: z.string().min(9, "Le numéro de téléphone est obligatoire"),
});

type FormValues = z.infer<typeof schema>;

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

const MAX_PHOTO_MB = 5;
const MAX_AUDIO_SECONDS = 120; // informatif; on ne valide pas la durée ici

export default function Report() {
  const navigate = useNavigate();
  const [geoLoading, setGeoLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [hasLocation, setHasLocation] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    document.title = "Signaler un incident · SenAlert";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Signalez un problème urbain au Sénégal: voirie, éclairage, propreté, etc.");
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { 
      description: "", 
      type: "", 
      anonymous_name: "", 
      anonymous_phone: "" 
    },
  });

  // Charger les catégories depuis la base de données
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categorie')
          .select('nom')
          .order('nom');

        if (error) {
          console.error('Error loading categories:', error);
          // Fallback aux catégories hardcodées
          setCategories([
            "Problème de voirie",
            "Éclairage public défaillant",
            "Propreté urbaine",
            "Mobilier urbain cassé",
            "Espaces verts mal entretenus",
            "Signalisation manquante",
            "Problèmes électriques",
          ]);
        } else {
          setCategories(data?.map(cat => cat.nom) || []);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([
          "Problème de voirie",
          "Éclairage public défaillant",
          "Propreté urbaine",
          "Mobilier urbain cassé",
          "Espaces verts mal entretenus",
          "Signalisation manquante",
          "Problèmes électriques",
        ]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Récupérer la géolocalisation automatiquement au chargement
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          form.setValue("latitude", pos.coords.latitude);
          form.setValue("longitude", pos.coords.longitude);
          setHasLocation(true);
          toast.success("Position détectée automatiquement");
        },
        () => {
          // Silencieux si pas de permission
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const onUseGeolocation = () => {
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue("latitude", pos.coords.latitude);
        form.setValue("longitude", pos.coords.longitude);
        setHasLocation(true);
        toast.success("Position détectée");
        setGeoLoading(false);
      },
      () => {
        toast.error("Impossible d'obtenir la position");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Fonctions pour la caméra
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setShowCamera(true);
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Impossible d'accéder à la caméra");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob and create file
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            form.setValue("photo", file as any);
            
            // Create preview URL
            const url = URL.createObjectURL(blob);
            setCapturedPhoto(url);
            
            toast.success("Photo capturée");
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  // Fonctions pour l'enregistrement audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      streamRef.current = stream;
      
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedAudio(blob);
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        form.setValue("audio", file as any);
        
        // Create audio URL for playback
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      toast.error("Impossible d'accéder au microphone");
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fonctions pour la lecture audio
  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteAudio = () => {
    setRecordedAudio(null);
    setAudioUrl(null);
    setIsPlaying(false);
    form.setValue("audio", undefined);
    setRecordingTime(0);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (capturedPhoto) {
        URL.revokeObjectURL(capturedPhoto);
      }
    };
  }, [audioUrl, capturedPhoto]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const code = genCode();
      let photoPath: string | null = null;
      let audioPath: string | null = null;

      if (values.photo) {
        const sizeMb = values.photo.size / 1024 / 1024;
        if (sizeMb > MAX_PHOTO_MB) {
          toast.error("Photo trop volumineuse (max 5MB)");
          return;
        }
        const path = `${code}/${Date.now()}-${values.photo.name}`;
        const { error } = await supabase.storage
          .from("report-photos")
          .upload(path, values.photo, { cacheControl: "3600", upsert: false });
        if (error) throw error;
        photoPath = path;
      }

      if (values.audio) {
        const path = `${code}/${Date.now()}-${values.audio.name}`;
        const { error } = await supabase.storage
          .from("report-audio")
          .upload(path, values.audio, { cacheControl: "3600", upsert: false });
        if (error) throw error;
        audioPath = path;
      }

      const { error: insertErr } = await supabase.from("reports").insert({
        description: values.description,
        type: values.type,
        anonymous_code: code,
        anonymous_name: values.anonymous_name,
        anonymous_phone: values.anonymous_phone,
        latitude: values.latitude ?? null,
        longitude: values.longitude ?? null,
        photo_url: photoPath,
        audio_url: audioPath,
        status: "en-attente",
      });
      if (insertErr) throw insertErr;

      setGeneratedCode(code);
      setShowSuccess(true);
    } catch (e: any) {
      console.error(e);
      toast.error("Erreur lors de l'envoi du signalement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessContinue = () => {
    setShowSuccess(false);
    form.reset();
    navigate('/');
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Signaler un incident</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Conseils section */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-yellow-800 text-sm font-bold">💡</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Conseils pour un bon signalement</h3>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• Soyez précis dans votre description</li>
                      <li>• Ajoutez une photo si possible</li>
                      <li>• Vérifiez l'adresse de l'incident</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Type d'incident */}
              <div className="space-y-3">
                <label className="text-base font-medium text-gray-900">Type d'incident *</label>
                <Select onValueChange={(v) => form.setValue("type", v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sélectionnez la catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.type && (
                  <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
                )}
              </div>

              {/* Informations personnelles */}
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900">Informations personnelles *</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="Nom complet *"
                      className="h-12"
                      {...form.register("anonymous_name")}
                    />
                    {form.formState.errors.anonymous_name && (
                      <p className="text-sm text-destructive">{form.formState.errors.anonymous_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Numéro de téléphone *"
                      type="tel"
                      className="h-12"
                      {...form.register("anonymous_phone")}
                    />
                    {form.formState.errors.anonymous_phone && (
                      <p className="text-sm text-destructive">{form.formState.errors.anonymous_phone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Localisation */}
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900">Localisation</h3>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-yellow-600" />
                  <span className="text-gray-700">
                    {hasLocation ? "Position détectée" : "Département de Guédiawaye, Guédiawaye"}
                  </span>
                </div>
                {!hasLocation && (
                  <>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input 
                        type="number" 
                        step="any" 
                        placeholder="Latitude"
                        className="h-12"
                        {...form.register("latitude", { valueAsNumber: true })} 
                      />
                      <Input 
                        type="number" 
                        step="any" 
                        placeholder="Longitude"
                        className="h-12"
                        {...form.register("longitude", { valueAsNumber: true })} 
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={onUseGeolocation} disabled={geoLoading} className="h-12">
                      <Crosshair className="mr-2 h-4 w-4" /> 
                      {geoLoading ? "Détection..." : "Utiliser ma position"}
                    </Button>
                  </>
                )}
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="text-base font-medium text-gray-900">Description *</label>
                <Textarea
                  rows={5}
                  placeholder="Décrivez l'incident en détail (minimum 15 caractères)..."
                  className="resize-none"
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                )}
              </div>

              {/* Photo */}
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900">Photo (optionnel)</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Bouton Caméra */}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-16 border-2 border-dashed border-blue-300 hover:border-blue-400 bg-blue-50"
                    onClick={startCamera}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <Camera className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-blue-700">Caméra</span>
                    </div>
                  </Button>
                  
                  {/* Bouton Upload depuis galerie */}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-16 border-2 border-dashed border-yellow-300 hover:border-yellow-400 bg-yellow-50"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <Image className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm text-yellow-700">Galerie</span>
                    </div>
                  </Button>
                </div>
                
                {/* Input file caché pour upload depuis galerie */}
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      form.setValue("photo", f as any);
                      // Create preview for uploaded image
                      const url = URL.createObjectURL(f);
                      setCapturedPhoto(url);
                      toast.success("Photo sélectionnée");
                    }
                  }}
                />

                {/* Preview de la photo capturée/sélectionnée */}
                {capturedPhoto && (
                  <div className="relative">
                    <img 
                      src={capturedPhoto} 
                      alt="Photo capturée" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setCapturedPhoto(null);
                        form.setValue("photo", undefined);
                        if (capturedPhoto) {
                          URL.revokeObjectURL(capturedPhoto);
                        }
                      }}
                      className="absolute top-2 right-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Interface caméra */}
                {showCamera && (
                  <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
                    <div className="relative max-w-lg w-full">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full aspect-video rounded-lg object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-6">
                        <Button
                          type="button"
                          onClick={capturePhoto}
                          className="bg-white text-black hover:bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center"
                        >
                          <Camera className="w-8 h-8" />
                        </Button>
                        <Button
                          type="button"
                          onClick={stopCamera}
                          className="bg-red-500 text-white hover:bg-red-600 rounded-full w-16 h-16 flex items-center justify-center"
                        >
                          <span className="text-2xl">✕</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message vocal */}
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900">Message vocal (optionnel)</h3>
                
                {!isRecording && !recordedAudio && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-16 border-2 border-dashed border-red-300 hover:border-red-400 bg-red-50"
                    onClick={startRecording}
                  >
                    <div className="flex items-center space-x-3">
                      <Mic className="w-5 h-5 text-red-600" />
                      <span className="text-red-700">Enregistrer un message vocal</span>
                    </div>
                  </Button>
                )}

                {isRecording && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-red-700 font-medium">Enregistrement en cours</span>
                      </div>
                      <span className="text-red-600 font-mono">{formatTime(recordingTime)}</span>
                    </div>
                    <Button
                      type="button"
                      onClick={stopRecording}
                      className="w-full bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Arrêter l'enregistrement
                    </Button>
                  </div>
                )}

                {recordedAudio && !isRecording && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-green-700 font-medium">Enregistrement terminé</span>
                      </div>
                      <span className="text-green-600 font-mono">{formatTime(recordingTime)}</span>
                    </div>
                    
                    {/* Audio player controls */}
                    <div className="flex items-center justify-center space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={isPlaying ? pauseAudio : playAudio}
                        className="flex items-center space-x-2"
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        <span>{isPlaying ? "Pause" : "Écouter"}</span>
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={deleteAudio}
                        className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Supprimer</span>
                      </Button>
                    </div>
                    
                    {/* Hidden audio element */}
                    {audioUrl && (
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Submit button */}
              <div className="pt-4">
                <Button 
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="w-full h-14 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" text="Envoi en cours..." />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>✈️</span>
                      <span>Envoyer le signalement</span>
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Animation de succès */}
      {showSuccess && (
        <SuccessAnimation 
          code={generatedCode} 
          onContinue={handleSuccessContinue}
        />
      )}
    </>
  );
}
