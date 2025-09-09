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
import { MapPin, Mic, Camera, Image, Square, ArrowLeft } from "lucide-react";
import SuccessAnimation from "@/components/SuccessAnimation";
import LoadingSpinner from "@/components/LoadingSpinner";
import AudioPlayer from "@/components/AudioPlayer";
import PhotoPreview from "@/components/PhotoPreview";
import MobileCameraCapture from "@/components/MobileCameraCapture";
import MobileAudioRecorder from "@/components/MobileAudioRecorder";
import { useLocationStore } from "@/stores/locationStore";
import { useRealtimeLocation } from "@/hooks/useRealtimeLocation";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showMobileAudio, setShowMobileAudio] = useState(false);
  
  // Location store integration
  const { 
    setLastReportLocation,
    addToAddressCache 
  } = useLocationStore();

  // Géolocalisation en temps réel
  const {
    currentLocation,
    isLocationLoading,
    locationError,
    isWatchingLocation
  } = useRealtimeLocation();

  useEffect(() => {
    document.title = "Signaler un incident · SenAlert - Alert urbaine Sénégal";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Alert: Signalez rapidement un problème urbain au Sénégal. Plateforme d'alert citoyenne pour voirie, éclairage, propreté. SenAlert, votre système d'alert municipal.");
    
    const keywords = document.querySelector('meta[name="keywords"]');
    if (keywords) keywords.setAttribute("content", "alert, alert urbaine, signalement alert, SenAlert, alert Sénégal, alert municipal, alert citoyen");
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
      }
    };

    loadCategories();
  }, []);

  // La géolocalisation en temps réel est gérée par le hook useRealtimeLocation

  // Sync current location with form when available (synchronisation parfaite)
  useEffect(() => {
    if (currentLocation) {
      // Mise à jour immédiate des coordonnées dans le formulaire
      form.setValue("latitude", currentLocation.latitude);
      form.setValue("longitude", currentLocation.longitude);
      
      // Log pour vérifier la synchronisation
      console.log('Coordonnées synchronisées dans le formulaire:', {
        lat: currentLocation.latitude.toFixed(6),
        lng: currentLocation.longitude.toFixed(6)
      });
    }
  }, [currentLocation, form]);


  // Fonctions pour la caméra avec gestion mobile
  const startCamera = async () => {
    setShowCamera(true);
  };



  // Fonctions pour l'enregistrement audio avec gestion mobile

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

  const deleteAudio = () => {
    console.log("Deleting audio...");
    setRecordedAudio(null);
    setAudioUrl(null);
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

      // Utiliser la position la plus récente disponible (synchronisation parfaite)
      const finalLatitude = currentLocation?.latitude ?? values.latitude;
      const finalLongitude = currentLocation?.longitude ?? values.longitude;
      
      // Log pour vérifier la synchronisation des coordonnées
      console.log('Coordonnées utilisées pour le signalement:', {
        lat: finalLatitude?.toFixed(7),
        lng: finalLongitude?.toFixed(7),
        source: currentLocation ? 'store' : 'formulaire'
      });

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
        latitude: finalLatitude ?? null,
        longitude: finalLongitude ?? null,
        photo_url: photoPath,
        audio_url: audioPath,
        status: "en-attente",
      });
      if (insertErr) throw insertErr;

      // Store location in cache for future use
      if (finalLatitude && finalLongitude) {
        const location = {
          latitude: finalLatitude,
          longitude: finalLongitude,
          address: currentLocation?.address,
          city: currentLocation?.city,
          department: currentLocation?.department
        };
        setLastReportLocation(location);
        
        // Add to address cache if available
        if (currentLocation?.address) {
          addToAddressCache(currentLocation.address, location);
        }
      }

      setGeneratedCode(code);
      setShowSuccess(true);
    } catch (e: unknown) {
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
          {/* Header avec bouton retour */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="mb-4 p-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
          
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
                <label htmlFor="type-select" className="text-base font-medium text-gray-900">Type d'incident *</label>
                <Select onValueChange={(v) => form.setValue("type", v)}>
                  <SelectTrigger id="type-select" className="h-12">
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
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-gray-900">Localisation</h3>
                  {isWatchingLocation && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span>GPS actif</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {/* Affichage principal de la localisation */}
                  <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      {currentLocation ? (
                        <div className="space-y-1">
                          <div className="text-gray-900 font-medium">
                            {currentLocation.address || `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
                          </div>
                          {currentLocation.city && (
                            <div className="text-sm text-gray-600">
                              {currentLocation.city}
                              {currentLocation.department && `, ${currentLocation.department}`}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 font-mono">
                            Coordonnées GPS: {currentLocation.latitude.toFixed(7)}, {currentLocation.longitude.toFixed(7)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-700">
                          {isLocationLoading ? "Localisation en cours..." : "Localisation non disponible"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message d'erreur */}
                  {locationError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm text-red-700">
                        ⚠️ {locationError}
                      </div>
                    </div>
                  )}


                  {/* Coordonnées manuelles (fallback) */}
                  {!currentLocation && (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        Ou saisissez manuellement les coordonnées :
                      </div>
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
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label htmlFor="description-textarea" className="text-base font-medium text-gray-900">Description *</label>
                <Textarea
                  id="description-textarea"
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
                      console.log("Photo selected from gallery:", f.name, f.size, "bytes");
                      form.setValue("photo", f);
                      // Create preview for uploaded image
                      const url = URL.createObjectURL(f);
                      console.log("Gallery photo URL created:", url);
                      setCapturedPhoto(url);
                      toast.success("Photo sélectionnée");
                    }
                  }}
                />

                {/* Preview de la photo capturée/sélectionnée */}
                <PhotoPreview 
                  photoUrl={capturedPhoto}
                  onDelete={() => {
                    console.log("Deleting photo...");
                    setCapturedPhoto(null);
                    form.setValue("photo", undefined);
                    if (capturedPhoto) {
                      URL.revokeObjectURL(capturedPhoto);
                    }
                  }}
                  alt="Photo capturée"
                />

                {/* Interface caméra mobile */}
                {showCamera && (
                  <MobileCameraCapture
                    onCapture={(file, previewUrl) => {
                      form.setValue("photo", file);
                      setCapturedPhoto(previewUrl);
                      setShowCamera(false);
                    }}
                    onClose={() => setShowCamera(false)}
                  />
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
                    onClick={() => setShowMobileAudio(true)}
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
                  <AudioPlayer 
                    audioUrl={audioUrl}
                    onDelete={deleteAudio}
                    recordingTime={recordingTime}
                  />
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

      {/* Interface audio mobile */}
      {showMobileAudio && (
        <MobileAudioRecorder
          onRecordingComplete={(file, audioUrl) => {
            form.setValue("audio", file);
            setAudioUrl(audioUrl);
            setRecordedAudio(new Blob()); // Pour déclencher l'affichage du player
            setShowMobileAudio(false);
          }}
          onClose={() => setShowMobileAudio(false)}
        />
      )}

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
