import { Button } from "@/components/ui/button";
import OpenStreetMap from "@/components/OpenStreetMap";
import IncidentsSection from "@/components/IncidentsSection";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Plus, Home, MessageSquare, Bell, Info, FileText, MapPin, Users, Settings } from "lucide-react";
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
        const {
          count
        } = await supabase.from('reports').select('*', {
          count: 'exact',
          head: true
        });
        setReportCount(count || 0);
      } catch (error) {
        console.error('Erreur lors du chargement du compteur:', error);
      }
    };
    loadReportCount();
  }, []);
  return <div className="min-h-screen bg-background">
      <header className="w-full border-b bg-background shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-bold">
                      S
                    </div>
                    <div>
                      <div className="text-xl font-bold">SenAlert</div>
                      <div className="text-sm text-muted-foreground font-normal">Plateforme citoyenne</div>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-8 space-y-2">
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={() => navigate("/")}>
                    <Home className="h-5 w-5" />
                    <span className="font-medium">Accueil</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={() => navigate("/suivi")}>
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">Mes signalements</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                    <Bell className="h-5 w-5" />
                    <span className="font-medium">Notifications</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">Communauté</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                    <Settings className="h-5 w-5" />
                    <span className="font-medium">Paramètres</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12">
                    <Info className="h-5 w-5" />
                    <span className="font-medium">À propos</span>
                  </Button>
                </nav>
                <div className="mt-8 pt-6 border-t">
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-semibold text-foreground">Département de Dakar</div>
                      <div className="text-muted-foreground">Région de Dakar, Sénégal</div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-bold">
                S
              </div>
              <div className="hidden sm:block">
                <div className="text-xl font-bold text-foreground">SenAlert</div>
                <div className="text-sm text-muted-foreground">Plateforme citoyenne</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Informations">
              <Info className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Carte interactive */}
        <section className="relative h-[50vh] min-h-[400px] z-0">
          <OpenStreetMap className="absolute inset-0" />
          
          {/* Compteur d'incidents superposé */}
          <div className="absolute bottom-6 left-6 bg-background/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-sm font-medium text-foreground">
                {reportCount} incident{reportCount !== 1 ? 's' : ''} rapporté{reportCount !== 1 ? 's' : ''} dans le département de Dakar
              </span>
            </div>
          </div>
        </section>

        {/* Bouton Signaler flottant */}
        <div className="relative -mt-8 mb-8 z-10">
          <div className="container flex justify-center">
            <Button 
              variant="signal" 
              size="lg" 
              onClick={() => navigate("/signaler")} 
              className="px-8 py-3 text-lg font-semibold rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
            >
              Signaler
            </Button>
          </div>
        </div>

        {/* Section des incidents */}
        <IncidentsSection />
      </main>

      <footer className="bg-footer-bg text-footer-foreground">
        <div className="container py-16">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-12">
            {/* Logo et description */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-white text-footer-bg rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                  S
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">SenAlert</div>
                  <div className="text-footer-foreground/80">Plateforme citoyenne</div>
                </div>
              </div>
              <div className="space-y-3 text-footer-foreground/90 leading-relaxed">
                <p>Plateforme de signalement citoyen pour le Sénégal.</p>
                <p>Connectons les citoyens aux services publics pour une ville plus intelligente et plus réactive.</p>
              </div>
            </div>

            {/* Navigation rapide */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Navigation</h3>
              <nav className="space-y-3">
                <a href="/" className="block text-footer-foreground/80 hover:text-white transition-colors">
                  Accueil
                </a>
                <a href="/signaler" className="block text-footer-foreground/80 hover:text-white transition-colors">
                  Signaler un problème
                </a>
                <a href="/suivi" className="block text-footer-foreground/80 hover:text-white transition-colors">
                  Suivi des signalements
                </a>
                <a href="/a-propos" className="block text-footer-foreground/80 hover:text-white transition-colors">
                  À propos
                </a>
              </nav>
            </div>

            {/* Contact et crédits */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Contact</h3>
              <div className="space-y-3 text-footer-foreground/90">
                <p>Département de Dakar</p>
                <p>Région de Dakar, Sénégal</p>
                <p>contact@senalert.sn</p>
              </div>
              <div className="pt-4 border-t border-footer-foreground/20">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <span className="text-footer-foreground/80">Fièrement développé par</span>
                  <span className="text-yellow-400 font-semibold">Digital Master Solution</span>
                </div>
                <div className="text-sm text-footer-foreground/70">
                  © {new Date().getFullYear()} SenAlert. Tous droits réservés.
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;