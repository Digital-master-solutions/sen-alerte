import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { LayoutList, CheckCircle, Clock, MapPin, RefreshCw } from "lucide-react";

interface Org {
  id: string;
  name: string;
  email: string | null;
}

interface Report {
  id: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
  department: string | null;
  address: string | null;
  anonymous_code: string | null;
  assigned_organization_id: string | null;
}

export default function OrgReports() {
  const { toast } = useToast();
  const [org, setOrg] = useState<Org | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [available, setAvailable] = useState<Report[]>([]);
  const [mine, setMine] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageAvail, setPageAvail] = useState(1);
  const [pageMine, setPageMine] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    document.title = "Signalements (Organisation) | SenAlert";
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) throw new Error("Non authentifié");

      const { data: orgRow, error: orgErr } = await supabase
        .from("organizations")
        .select("id,name,email")
        .eq("supabase_user_id", uid)
        .single();
      if (orgErr) throw orgErr;
      setOrg(orgRow);

      const { data: cats, error: catsErr } = await supabase
        .from("categorie_organization")
        .select("categorie: categorie_id (nom)")
        .eq("organization_id", orgRow.id);
      if (catsErr) throw catsErr;
      const noms = (cats || []).map((c: any) => c.categorie?.nom).filter(Boolean);
      setCategories(noms);

      await Promise.all([loadAvailable(noms), loadMine(orgRow.id)]);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message || "Chargement impossible" });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailable = async (noms: string[]) => {
    if (!noms.length) {
      setAvailable([]);
      return;
    }
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .is("assigned_organization_id", null)
      .in("type", noms)
      .order("created_at", { ascending: false });
    if (error) throw error;
    setAvailable(data || []);
  };

  const loadMine = async (orgId: string) => {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("assigned_organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    setMine(data || []);
  };

  const filteredAvailable = useMemo(() => {
    if (!search) return available;
    return available.filter((r) =>
      [r.type, r.description, r.department, r.anonymous_code]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(search.toLowerCase()))
    );
  }, [available, search]);

  const filteredMine = useMemo(() => {
    if (!search) return mine;
    return mine.filter((r) =>
      [r.type, r.description, r.department, r.anonymous_code]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(search.toLowerCase()))
    );
  }, [mine, search]);

  const totalAvail = Math.max(1, Math.ceil(filteredAvailable.length / pageSize));
  const totalMine = Math.max(1, Math.ceil(filteredMine.length / pageSize));
  const pageAvailItems = filteredAvailable.slice((pageAvail - 1) * pageSize, pageAvail * pageSize);
  const pageMineItems = filteredMine.slice((pageMine - 1) * pageSize, pageMine * pageSize);

  const claimReport = async (reportId: string) => {
    if (!org) return;
    try {
      const { error } = await supabase
        .from("reports")
        .update({ assigned_organization_id: org.id })
        .eq("id", reportId);
      if (error) throw error;
      toast({ title: "Pris en charge" });
      await Promise.all([loadAvailable(categories), loadMine(org.id)]);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message || "Action impossible" });
    }
  };

  const updateStatus = async (reportId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status })
        .eq("id", reportId);
      if (error) throw error;
      toast({ title: "Statut mis à jour" });
      if (org) await loadMine(org.id);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message || "Mise à jour impossible" });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-12 bg-muted rounded" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organisation introuvable</CardTitle>
          <CardDescription>
            Votre compte est connecté mais aucun profil d’organisation n’est lié. Veuillez contacter l’administrateur.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Signalements</h1>
          <p className="text-muted-foreground">Catégories: {categories.join(", ") || "aucune"}</p>
        </div>
        <Button variant="outline" onClick={loadAll}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutList className="h-5 w-5" /> Disponibles ({filteredAvailable.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune catégorie associée. Contactez l’administrateur.</p>
            )}

            {pageAvailItems.map((r) => (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{r.type}</h3>
                        <Badge variant="secondary">{r.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{r.department || "—"}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => claimReport(r.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Gérer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredAvailable.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun signalement disponible.</p>
            )}

            <div className="mt-2 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationPrevious onClick={() => setPageAvail((p) => Math.max(1, p - 1))} />
                  <PaginationItem>
                    <span className="px-3 py-2 text-sm">Page {pageAvail} / {totalAvail}</span>
                  </PaginationItem>
                  <PaginationNext onClick={() => setPageAvail((p) => Math.min(totalAvail, p + 1))} />
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutList className="h-5 w-5" /> Pris en charge ({filteredMine.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pageMineItems.map((r) => (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{r.type}</h3>
                        <Badge variant="secondary">{r.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{r.department || "—"}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(v) => updateStatus(r.id, v)}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Changer l’état" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en-attente">En attente</SelectItem>
                          <SelectItem value="en-cours">En cours</SelectItem>
                          <SelectItem value="resolu">Résolu</SelectItem>
                          <SelectItem value="rejete">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredMine.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun signalement pris en charge.</p>
            )}

            <div className="mt-2 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationPrevious onClick={() => setPageMine((p) => Math.max(1, p - 1))} />
                  <PaginationItem>
                    <span className="px-3 py-2 text-sm">Page {pageMine} / {totalMine}</span>
                  </PaginationItem>
                  <PaginationNext onClick={() => setPageMine((p) => Math.min(totalMine, p + 1))} />
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
