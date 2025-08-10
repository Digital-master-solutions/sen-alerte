import { Button } from "@/components/ui/button";
import MapLibreMap from "@/components/MapLibreMap";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Plus, Home, MessageSquare, Bell, Info, FileText, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    document.title = "SenAlert · Alertes urbaines au Sénégal";
    
    // Charger le nombre total de signalements
    const loadReportCount = async () => {
      try {
        const { count } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true });
        setReportCount(count || 0);
      } catch (error) {
        console.error('Erreur lors du chargement du compteur:', error);
      }
    };
    
    loadReportCount();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="w-full border-b bg-white shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Ouvrir le menu" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      S
                    </div>
                    SenAlert
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 space-y-1">
                  <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => navigate("/")}>
                    <Home className="h-4 w-4" />
                    Accueil
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => navigate("/suivi")}>
                    <FileText className="h-4 w-4" />
                    Mes signalements
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <Info className="h-4 w-4" />
                    À propos
                  </Button>
                </nav>
                <div className="mt-8 pt-6 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Département de</div>
                      <div>Dakar</div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                S
              </div>
              <span className="font-semibold text-lg">SenAlert</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Informations">
              <Info className="h-5 w-5" />
            </Button>
            <Button variant="default" onClick={() => navigate("/auth")}>
              Connexion
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative h-[calc(100vh-4rem)]">
          <MapLibreMap className="absolute inset-0" />
          
          {/* Bouton Signaler centré */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Button
              variant="signal"
              size="lg"
              onClick={() => navigate("/signaler")}
              className="pointer-events-auto px-8 py-3 text-lg font-semibold rounded-full shadow-lg"
            >
              <Plus className="mr-2 h-6 w-6" />
              Signaler
            </Button>
          </div>

          {/* Compteur d'incidents en bas */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg border shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-primary rounded-full"></div>
                <div>
                  <div className="font-semibold text-lg">
                    {reportCount} incident{reportCount !== 1 ? 's' : ''} rapporté{reportCount !== 1 ? 's' : ''} dans le département de Dakar
                  </div>
                  {reportCount === 0 && (
                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="text-lg font-medium text-foreground mb-1">
                        Aucun incident signalé dans le département de Dakar
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Soyez le premier à signaler un problème !
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-footer-bg text-footer-foreground">
        <div className="container py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white text-footer-bg rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
                  S
                </div>
                <div>
                  <div className="text-xl font-bold text-white">SenAlert</div>
                  <div className="text-sm text-footer-foreground/80">Plateforme citoyenne</div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-footer-foreground/90">
                <p>Plateforme de signalement citoyen pour le Sénégal</p>
                <p>Connectons les citoyens aux services publics</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="flex items-center justify-center md:justify-end gap-2 text-sm mb-2">
                <span>Fièrement développé par</span>
                <span className="text-yellow-400 font-semibold">Digital Master Solution</span>
              </div>
              <div className="text-sm text-footer-foreground/80">
                © {new Date().getFullYear()} ❤️ SenAlert
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;