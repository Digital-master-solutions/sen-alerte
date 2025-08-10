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
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <label className="text-sm">Catégorie</label>
              <Select onValueChange={(v) => form.setValue("type", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie" />
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

            <div className="grid gap-2">
              <label className="text-sm">Description</label>
              <Textarea
                rows={5}
                placeholder="Décrivez le problème le plus précisément possible"
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm">Latitude</label>
                <Input type="number" step="any" {...form.register("latitude", { valueAsNumber: true })} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm">Longitude</label>
                <Input type="number" step="any" {...form.register("longitude", { valueAsNumber: true })} />
              </div>
            </div>
            <Button type="button" variant="outline" onClick={onUseGeolocation} disabled={geoLoading}>
              <Crosshair className="mr-2 h-4 w-4" /> {geoLoading ? "Détection..." : "Utiliser ma position"}
            </Button>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <label className="text-sm">Photo (optionnel)</label>
                <Input type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  form.setValue("photo", (f as unknown as File) || undefined);
                }} />
                <p className="text-xs text-muted-foreground">JPG/PNG, max 5MB</p>
              </div>
              <div className="grid gap-2">
                <label className="text-sm">Audio (optionnel)</label>
                <Input type="file" accept="audio/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  form.setValue("audio", (f as unknown as File) || undefined);
                }} />
                <p className="text-xs text-muted-foreground">Max ~2 minutes</p>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="hero" size="lg" onClick={form.handleSubmit(onSubmit)}>
                <Upload className="mr-2 h-4 w-4" /> Envoyer le signalement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
