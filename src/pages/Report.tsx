import { useEffect, useMemo, useState } from "react";
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
import { MapPin, Upload, Mic, Crosshair } from "lucide-react";

const schema = z.object({
  description: z.string().min(10, "Décrivez le problème (min 10 caractères)"),
  type: z.string().min(1, "Choisissez une catégorie"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  photo: z.instanceof(File).optional(),
  audio: z.instanceof(File).optional(),
  anonymous_name: z.string().optional(),
  anonymous_phone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `SN-${out}`;
}

const MAX_PHOTO_MB = 5;
const MAX_AUDIO_SECONDS = 120; // informatif; on ne valide pas la durée ici

export default function Report() {
  const navigate = useNavigate();
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    document.title = "Signaler un incident · SenAlert";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Signalez un problème urbain au Sénégal: voirie, éclairage, propreté, etc.");
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { description: "", type: "" },
  });

  const categories = useMemo(
    () => [
      "Problème de voirie",
      "Éclairage public défaillant",
      "Propreté urbaine",
      "Mobilier urbain cassé",
      "Espaces verts mal entretenus",
      "Signalisation manquante",
      "Problèmes électriques",
    ],
    []
  );

  const onUseGeolocation = () => {
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue("latitude", pos.coords.latitude);
        form.setValue("longitude", pos.coords.longitude);
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

  const onSubmit = async (values: FormValues) => {
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

      toast.success("Signalement envoyé ! Code de suivi: " + code);
      navigate(`/suivi?code=${encodeURIComponent(code)}`);
    } catch (e: any) {
      console.error(e);
      toast.error("Erreur lors de l'envoi du signalement");
    }
  };

  return (
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
              <h3 className="text-base font-medium text-gray-900">Informations personnelles</h3>
              <div className="grid gap-4">
                <Input
                  placeholder="Prénom et Nom"
                  className="h-12"
                  {...form.register("anonymous_name")}
                />
                <Input
                  placeholder="Numéro de téléphone *"
                  type="tel"
                  className="h-12"
                  {...form.register("anonymous_phone")}
                />
              </div>
            </div>

            {/* Localisation */}
            <div className="space-y-4">
              <h3 className="text-base font-medium text-gray-900">Localisation</h3>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-yellow-600" />
                <span className="text-gray-700">Département de Guédiawaye, Guédiawaye</span>
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
              <Button type="button" variant="outline" onClick={onUseGeolocation} disabled={geoLoading} className="h-12">
                <Crosshair className="mr-2 h-4 w-4" /> 
                {geoLoading ? "Détection..." : "Utiliser ma position"}
              </Button>
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
                <Button
                  type="button"
                  variant="outline"
                  className="h-16 border-2 border-dashed border-gray-300 hover:border-gray-400"
                  onClick={() => document.getElementById('photo-input')?.click()}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      📷
                    </div>
                    <span className="text-sm">Photo</span>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-16 border-2 border-dashed border-yellow-300 hover:border-yellow-400 bg-yellow-50"
                  onClick={() => document.getElementById('photo-input')?.click()}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <Upload className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-700">Upload</span>
                  </div>
                </Button>
              </div>
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  form.setValue("photo", (f as unknown as File) || undefined);
                }}
              />
            </div>

            {/* Message vocal */}
            <div className="space-y-4">
              <h3 className="text-base font-medium text-gray-900">Message vocal (optionnel)</h3>
              <Button
                type="button"
                variant="outline"
                className="w-full h-16 border-2 border-dashed border-gray-300"
                onClick={() => document.getElementById('audio-input')?.click()}
              >
                <div className="flex items-center space-x-3">
                  <Mic className="w-5 h-5 text-gray-600" />
                  <span>Enregistrer un message vocal</span>
                </div>
              </Button>
              <input
                id="audio-input"
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  form.setValue("audio", (f as unknown as File) || undefined);
                }}
              />
            </div>

            {/* Submit button */}
            <div className="pt-4">
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                className="w-full h-14 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium text-lg"
                size="lg"
              >
                <div className="flex items-center space-x-2">
                  <span>✈️</span>
                  <span>Envoyer le signalement</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
