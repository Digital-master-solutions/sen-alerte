import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationSignupStepper } from "@/components/organization/OrganizationSignupStepper";
import { useAuthStore } from "@/stores";
import { AUTH_SUCCESS_MESSAGES, getAuthErrorInfo } from "@/utils/auth-messages";

export default function OrgLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  useEffect(() => {
    document.title = "Connexion Organisation | SenAlert";
  }, []);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("Tentative de connexion JWT pour organisation:", email);
      
      // Try JWT login first
      try {
        const { loginWithJWT } = useAuthStore.getState();
        const result = await loginWithJWT(email, password, 'organization');
        
        if (result) {
          const { user } = useAuthStore.getState();
          toast({ 
            title: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS_GENERIC,
            description: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS_ORG(user?.name || '')
          });
          navigate("/organization/dashboard", { replace: true });
          return;
        }
      } catch (jwtError) {
        console.warn("JWT login failed, trying fallback:", jwtError);
      }
      
      // Fallback to RPC authentication  
      console.log("Using RPC fallback authentication");
      const { data: orgData, error } = await supabase
        .rpc('authenticate_organization', { 
          org_email: email, 
          plain_password: password 
        });

      if (error) throw error;
      
      if (!orgData || orgData.length === 0) {
        // Vérifier si l'organisation existe pour déterminer le type d'erreur
        const { data: orgExists } = await supabase
          .from('organizations')
          .select('id, status, is_active')
          .eq('email', email)
          .single();

        if (!orgExists) {
          throw new Error("Email ou mot de passe incorrect");
        } else if (orgExists.status !== 'approved') {
          throw new Error("Votre compte n'est pas encore approuvé. Veuillez contacter l'administrateur.");
        } else if (!orgExists.is_active) {
          throw new Error("Votre compte a été désactivé. Veuillez contacter l'administrateur.");
        } else {
          throw new Error("Email ou mot de passe incorrect");
        }
      }

      const organization = orgData[0];
      
      // Organization login successful
      
      const orgUser = {
        id: organization.id,
        name: organization.name,
        email: organization.email,
        type: organization.type,
        status: organization.status,
        created_at: organization.created_at
      };
      
      setAuth(orgUser, 'organization');

      toast({ 
        title: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS_GENERIC,
        description: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS_ORG(organization.name)
      });
      navigate("/organization/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Erreur de connexion:", err);
      
      const errorInfo = getAuthErrorInfo(err);
      
      toast({ 
        variant: "destructive", 
        title: errorInfo.title, 
        description: errorInfo.description
      });
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert([
          {
            name: 'Nouvelle Organisation',
            email: email,
            password_hash: btoa(password), // Simple base64 encoding
            type: 'municipal',
            status: 'pending',
            is_active: false
          }
        ])
        .select();

      if (error) throw error;

      toast({ 
        title: "Inscription réussie",
        description: "Votre compte sera activé après approbation par l'administrateur"
      });
      
      // Reset form
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error("Erreur d'inscription:", err);
      let errorMessage = "Une erreur est survenue lors de l'inscription";
      
      if (err.message.includes('duplicate') || err.message.includes('already exists')) {
        errorMessage = "Cette adresse email est déjà utilisée.";
      } else if (err.message.includes('network')) {
        errorMessage = "Erreur de connexion. Vérifiez votre internet.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast({
        variant: "destructive",
        title: "Erreur lors de l'inscription",
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-primary">
              Connexion Organisation
            </CardTitle>
            <p className="text-muted-foreground">
              Accédez à votre espace de gestion des signalements
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={onLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? "Connexion..." : "Se connecter"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <OrganizationSignupStepper />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
