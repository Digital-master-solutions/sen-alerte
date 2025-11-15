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
      // Use Supabase Auth login
      const { loginWithSupabase } = useAuthStore.getState();
      await loginWithSupabase(email, password, 'organization');
      
      const { profile } = useAuthStore.getState();
      toast({ 
        title: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS_GENERIC,
        description: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS_ORG(profile?.name || '')
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
            <div className="space-y-4">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
