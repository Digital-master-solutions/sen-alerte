import { Button } from "@/components/ui/button";
import OpenStreetMap from "@/components/OpenStreetMap";
import IncidentsSection from "@/components/IncidentsSection";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Plus, Home, Bell, Info, FileText, MapPin, Users, Settings, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Logo } from "@/components/ui/logo";
import { FeedbackDialog } from "@/components/FeedbackDialog";
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
      <SEOHead 
        title="SenAlert · Plateforme d'alertes urbaines au Sénégal"
        description="Signalez et suivez les problèmes urbains au Sénégal : voirie, éclairage public, propreté. Plateforme collaborative citoyens-municipalités."
        keywords={["Sénégal", "alertes urbaines", "signalement", "voirie", "éclairage public", "propreté", "municipalité", "citoyens", "infrastructure", "Dakar"]}
      />
      
      <header className="w-full border-b bg-secondary/30 backdrop-blur-sm shadow-sm">
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
                  <SheetTitle>
                    <Logo size="lg" />
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-8 space-y-2">
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={() => navigate("/")}>
                    <Home className="h-5 w-5" />
                    <span className="font-medium">Accueil</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={() => navigate("/mes-signalements")}>
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">Mes signalements</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={() => navigate("/notifications")}>
                    <Bell className="h-5 w-5" />
                    <span className="font-medium">Notifications</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={() => navigate("/a-propos")}>
                    <Info className="h-5 w-5" />
                    <span className="font-medium">À propos</span>
                  </Button>
                </nav>
                
                {/* Section Organisation */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-3">Espace Organisation</h3>
                  <nav className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={() => navigate("/organization/login")}>
                      <Users className="h-5 w-5" />
                      <span className="font-medium">Connexion Organisation</span>
                    </Button>
                  </nav>
                </div>
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
            <Logo size="lg" className="hidden sm:flex" />
            <Logo size="md" className="sm:hidden" />
          </div>
          <div className="flex items-center gap-3">
            <FeedbackDialog />
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Notifications"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Informations"
              onClick={() => navigate('/a-propos')}
            >
              <Info className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Carte interactive - Largest Contentful Paint element */}
        <section className="relative h-[50vh] min-h-[400px] z-0">
          <ErrorBoundary>
          <OpenStreetMap className="absolute inset-0" />
          </ErrorBoundary>
          
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
              <Logo size="xl" className="text-white" />
              <div className="space-y-4 text-footer-foreground/90 leading-relaxed">
                <p className="text-base">
                  SenAlert est une plateforme de signalement citoyen qui facilite la communication entre les citoyens et les services municipaux au Sénégal.
                </p>
                <p className="text-sm">
                  Notre mission est de créer des villes plus intelligentes et plus réactives en permettant aux citoyens de signaler rapidement les problèmes urbains et de suivre leur résolution en temps réel.
                </p>
              </div>
            </div>

            {/* Navigation rapide */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Navigation Rapide</h3>
              <nav className="space-y-3">
                <button 
                  onClick={() => navigate("/")} 
                  className="block text-left text-footer-foreground/80 hover:text-white transition-colors cursor-pointer"
                >
                  Accueil
                </button>
                <button 
                  onClick={() => navigate("/signaler")} 
                  className="block text-left text-footer-foreground/80 hover:text-white transition-colors cursor-pointer"
                >
                  Signaler un problème
                </button>
                <button 
                  onClick={() => navigate("/mes-signalements")} 
                  className="block text-left text-footer-foreground/80 hover:text-white transition-colors cursor-pointer"
                >
                  Mes signalements
                </button>
                <button 
                  onClick={() => navigate("/notifications")} 
                  className="block text-left text-footer-foreground/80 hover:text-white transition-colors cursor-pointer"
                >
                  Notifications
                </button>
                <button 
                  onClick={() => navigate("/a-propos")} 
                  className="block text-left text-footer-foreground/80 hover:text-white transition-colors cursor-pointer"
                >
                  À propos
                </button>
              </nav>
            </div>

            {/* Contact et informations */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Nous Contacter</h3>
              <div className="space-y-4 text-footer-foreground/90">
                <div>
                  <p className="font-medium text-white mb-1">Zone de couverture</p>
                  <p className="text-sm">Département de Dakar</p>
                  <p className="text-sm">Région de Dakar, Sénégal</p>
                </div>
                <div>
                  <p className="font-medium text-white mb-1">Support technique</p>
                  <a 
                    href="mailto:digitalmsolution2025@gmail.com"
                    className="text-sm hover:text-white transition-colors"
                  >
                    digitalmsolution2025@gmail.com
                  </a>
                </div>
              </div>
              <div className="pt-6 border-t border-footer-foreground/20">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-footer-foreground/80">Développé par</span>
                    <a 
                      href="https://dms-sn.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors"
                    >
                      Digital Master Solution
                    </a>
                  </div>
                  <div className="text-sm text-footer-foreground/70">
                    © {new Date().getFullYear()} SenAlert. Tous droits réservés.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;