import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Phone, User, Calendar, MessageSquare, Tag } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Feedback {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string;
  type: string;
  status: string;
  created_at: string;
}

export default function FeedbackDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadFeedback();
    }
  }, [id]);

  const loadFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setFeedback(data);
    } catch (error) {
      console.error("Error loading feedback:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      suggestion: { label: "Suggestion", variant: "default" as const },
      bug: { label: "Bug", variant: "destructive" as const },
      improvement: { label: "Amélioration", variant: "secondary" as const },
      other: { label: "Autre", variant: "outline" as const },
    };
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.other;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      nouveau: { label: "Nouveau", variant: "default" as const },
      lu: { label: "Lu", variant: "secondary" as const },
      traite: { label: "Traité", variant: "outline" as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.nouveau;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Feedback non trouvé</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate("/securepass/feedbacks")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux feedbacks
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/securepass/feedbacks")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux feedbacks
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">Détails du feedback</CardTitle>
              <div className="flex items-center gap-2">
                {getTypeBadge(feedback.type)}
                {getStatusBadge(feedback.status)}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informations de contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations de contact
            </h3>
            <Separator />
            
            <div className="grid gap-4 md:grid-cols-3">
              {feedback.name && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nom
                  </p>
                  <p className="font-medium">{feedback.name}</p>
                </div>
              )}

              {feedback.email && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </p>
                  <p className="font-medium">{feedback.email}</p>
                </div>
              )}

              {feedback.phone && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Téléphone
                  </p>
                  <p className="font-medium">{feedback.phone}</p>
                </div>
              )}
            </div>

            {!feedback.name && !feedback.email && !feedback.phone && (
              <p className="text-sm text-muted-foreground italic">
                Aucune information de contact fournie
              </p>
            )}
          </div>

          {/* Date de création */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date de soumission
            </p>
            <p className="font-medium">
              {new Date(feedback.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <Separator />

          {/* Message */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Message
            </h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="whitespace-pre-wrap leading-relaxed">{feedback.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
