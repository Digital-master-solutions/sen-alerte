import { Button } from "@/components/ui/button";
import MapLibreMap from "@/components/MapLibreMap";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Plus } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  useEffect(() => {
    document.title = "SenAlert · Alertes urbaines au Sénégal";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="w-full border-b">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Ouvrir le menu" className="sm:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>SenAlert</SheetTitle>
                </SheetHeader>
                <nav className="mt-4 grid gap-2">
                  <Button variant="ghost" onClick={() => navigate("/suivi")}>
                    Suivi
                  </Button>
                  <Button variant="hero" onClick={() => navigate("/signaler")}>
                    Signaler
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
            <a href="/" className="font-semibold">SenAlert</a>
          </div>
          <nav className="hidden sm:flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/suivi")}>Suivi</Button>
            <Button variant="hero" onClick={() => navigate("/signaler")}>Signaler</Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative h-[70vh]">
          <MapLibreMap className="absolute inset-0" />
          <div className="relative z-10 h-full flex items-center">
            <div className="container">
              <div className="max-w-2xl rounded-xl p-6 bg-card/80 backdrop-blur shadow-xl">
                <h1 className="text-3xl sm:text-4xl font-bold mb-3">Signalez et suivez les problèmes urbains près de chez vous</h1>
                <p className="text-muted-foreground mb-5">Un code unique pour suivre vos demandes. Collaboration transparente avec les organisations locales.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input placeholder="Entrer un code de suivi" value={code} onChange={(e)=>setCode(e.target.value.toUpperCase())} />
                  <Button onClick={() => navigate(`/suivi?code=${encodeURIComponent(code)}`)}>Consulter</Button>
                  <Button variant="hero" onClick={() => navigate("/signaler")}>Signaler un incident</Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Pas de code ? Cliquez sur “Signaler un incident” pour créer un nouveau signalement.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-12 grid sm:grid-cols-3 gap-6">
          <div className="rounded-lg border p-6">
            <h2 className="font-semibold mb-2">Participation citoyenne</h2>
            <p className="text-sm text-muted-foreground">Signalez en 2 minutes, sans compte. Suivez l'avancement en temps réel.</p>
          </div>
          <div className="rounded-lg border p-6">
            <h2 className="font-semibold mb-2">Cartographie claire</h2>
            <p className="text-sm text-muted-foreground">Visualisez les signalements sur une carte centrée sur le Sénégal.</p>
          </div>
          <div className="rounded-lg border p-6">
            <h2 className="font-semibold mb-2">Collaboration efficace</h2>
            <p className="text-sm text-muted-foreground">Les organisations reçoivent, traitent et informent les citoyens.</p>
          </div>
        </section>
      </main>

      <Button
        variant="hero"
        onClick={() => navigate("/signaler")}
        aria-label="Créer un signalement"
        className="fixed bottom-6 right-6 z-50 shadow-lg"
      >
        <Plus className="mr-2 h-5 w-5" />
        Signaler
      </Button>

      <footer className="border-t">
        <div className="container py-8 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} SenAlert</p>
          <nav className="flex gap-4">
            <a href="/suivi" className="hover:underline">Suivi</a>
            <a href="/signaler" className="hover:underline">Signaler</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Index;
