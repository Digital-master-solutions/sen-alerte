import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

interface Org { id: string; name: string; email: string | null; phone: string | null; city: string | null; }

export default function OrgSettings() {
  const { toast } = useToast();
  const [org, setOrg] = useState<Org | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Paramètres | Organisation";
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user.id;
      if (!uid) throw new Error("Non authentifié");

      const { data: orgRow, error } = await supabase
        .from("organizations")
        .select("id,name,email,phone,city")
        .eq("supabase_user_id", uid)
        .maybeSingle();
      if (error) throw error;
      if (!orgRow) throw new Error("Organisation introuvable");
      setOrg(orgRow);
      setName(orgRow.name || "");
      setEmail(orgRow.email || "");
      setPhone(orgRow.phone || "");
      setCity(orgRow.city || "");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!org) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ name, email, phone, city })
        .eq("id", org.id);
      if (error) throw error;
      if (password.trim()) {
        const { error: e2 } = await supabase.auth.updateUser({ password: password.trim() });
        if (e2) throw e2;
      }
      toast({ title: "Modifications enregistrées" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Informations du compte</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Ville</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> Enregistrer
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Mot de passe</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nouveau mot de passe</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> Mettre à jour
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
