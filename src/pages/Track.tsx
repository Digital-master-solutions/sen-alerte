import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

interface ReportRow {
  id: string;
  description: string;
  type: string;
  status: string | null;
  created_at: string | null;
  photo_url: string | null;
}

export default function Track() {
  const [code, setCode] = useState("");
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [params] = useSearchParams();

  useEffect(() => {
    document.title = "Suivi des signalements · SenAlert";
  }, []);

  useEffect(() => {
    const initial = params.get("code");
    if (initial) {
      setCode(initial);
      void search(initial);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusLabel = (s: string | null) => {
    switch (s) {
      case "en-attente":
        return "En attente";
      case "en-cours":
        return "En cours";
      case "resolu":
        return "Terminé";
      case "annule":
        return "Annulé";
      default:
        return s ?? "-";
    }
  };

  const search = async (c: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("id, description, type, status, created_at, photo_url")
        .eq("anonymous_code", c)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReports(data ?? []);
      if (!data || data.length === 0) toast.info("Aucun signalement pour ce code");
    } catch (e) {
      console.error(e);
      toast.error("Erreur de recherche");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <Input
            placeholder="Entrer votre code (8 caractères alphanumériques)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
          />
          <Button variant="default" onClick={() => search(code)} disabled={loading}>
            Rechercher
          </Button>
        </div>

        <div className="grid gap-4">
          {reports.map((r) => (
            <Card key={r.id} className="border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{r.type}</CardTitle>
                <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">
                  {statusLabel(r.status)}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.description}</p>
                <div className="mt-3 text-xs text-muted-foreground">
                  {r.created_at && new Date(r.created_at).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
          {reports.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">Entrez votre code pour consulter vos signalements.</p>
          )}
        </div>
      </div>
    </div>
  );
}
