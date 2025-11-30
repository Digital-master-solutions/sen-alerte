import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle, MessageSquare, Mail, Phone, User, FileText, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { SEOHead } from "@/components/SEOHead";

interface FeedbackData {
  name: string;
  email: string;
  phone: string;
  type: string;
  message: string;
}

export default function Feedback() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<FeedbackData & { timestamp: string } | null>(null);
  const [formData, setFormData] = useState<FeedbackData>({
    name: "",
    email: "",
    phone: "",
    type: "suggestion",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("feedbacks").insert([
        {
          name: formData.name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          type: formData.type,
          message: formData.message,
        },
      ]);

      if (error) throw error;

      // Sauvegarder les données soumises avec timestamp
      setSubmittedData({
        ...formData,
        timestamp: new Date().toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      });
      
      setSubmitted(true);

      toast({
        title: "Feedback envoyé",
        description: "Merci pour votre retour ! Nous l'examinerons attentivement.",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      suggestion: "Suggestion",
      bug: "Bug",
      amelioration: "Amélioration",
      autre: "Autre",
    };
    return labels[type] || type;
  };

  if (submitted && submittedData) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Feedback envoyé · SenAlert"
          description="Votre feedback a été envoyé avec succès"
        />
        
        <header className="w-full border-b bg-secondary/30 backdrop-blur-sm shadow-sm">
          <div className="container flex h-16 items-center">
            <Logo size="lg" />
          </div>
        </header>

        <main className="container max-w-2xl py-12">
          <div className="flex flex-col items-center space-y-8 text-center animate-fade-in">
            {/* Animation de succès */}
            <div className="relative">
              <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center animate-scale-in">
                <CheckCircle className="w-12 h-12 text-accent animate-pulse" />
              </div>
            </div>

            {/* Message de remerciement */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-foreground">
                Merci pour votre feedback !
              </h1>
              <p className="text-lg text-muted-foreground max-w-md">
                Nous avons bien reçu votre retour et l'examinerons attentivement.
              </p>
            </div>

            {/* Récapitulatif */}
            <div className="w-full bg-card border rounded-lg p-6 text-left space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold">Récapitulatif</span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Type de feedback</span>
                  <p className="text-base font-medium text-foreground mt-1">
                    {getTypeLabel(submittedData.type)}
                  </p>
                </div>

                <div>
                  <span className="text-sm font-medium text-muted-foreground">Message</span>
                  <p className="text-base text-foreground mt-1 whitespace-pre-wrap">
                    {submittedData.message}
                  </p>
                </div>

                {submittedData.name && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Nom</span>
                    <p className="text-base text-foreground mt-1">{submittedData.name}</p>
                  </div>
                )}

                {submittedData.email && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Email</span>
                    <p className="text-base text-foreground mt-1">{submittedData.email}</p>
                  </div>
                )}

                {submittedData.phone && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Téléphone</span>
                    <p className="text-base text-foreground mt-1">{submittedData.phone}</p>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <span className="text-sm font-medium text-muted-foreground">Envoyé le</span>
                  <p className="text-base text-foreground mt-1">{submittedData.timestamp}</p>
                </div>
              </div>
            </div>

            {/* Bouton retour */}
            <Button 
              size="lg"
              onClick={() => navigate("/")}
              className="gap-2 px-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à l'accueil
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Envoyer un feedback · SenAlert"
        description="Partagez vos suggestions, signalez des bugs ou proposez des améliorations pour SenAlert"
      />
      
      <header className="w-full border-b bg-secondary/30 backdrop-blur-sm shadow-sm">
        <div className="container flex h-16 items-center">
          <Logo size="lg" />
        </div>
      </header>

      <main className="container max-w-2xl py-12">
        <div className="space-y-6">
          {/* Bouton retour */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Button>

          {/* En-tête */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Envoyer un feedback
                </h1>
              </div>
            </div>
            <p className="text-lg text-muted-foreground">
              Partagez vos suggestions, signalez des bugs ou proposez des améliorations pour SenAlert.
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-lg p-6 shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nom (optionnel)
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Votre nom"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email (optionnel)
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="votre@email.com"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Téléphone (optionnel)
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+221 XX XXX XX XX"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type de feedback</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="amelioration">Amélioration</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Message *
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Décrivez votre feedback..."
                rows={6}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" disabled={loading} size="lg" className="w-full gap-2">
              <Send className="w-4 h-4" />
              {loading ? "Envoi..." : "Envoyer"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
