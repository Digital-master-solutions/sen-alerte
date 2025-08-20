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
      // Use custom authentication function
      const { data: orgData, error } = await supabase
        .rpc('authenticate_organization', { 
          org_email: email, 
          plain_password: password 
        });

      if (error) throw error;
      
      if (!orgData || orgData.length === 0) {
        throw new Error("Email ou mot de passe incorrect, ou compte non approuvé");
      }

      const organization = orgData[0];
      
      // Store organization data in Zustand store AND localStorage for backward compatibility
      const orgUser = {
        id: organization.id,
        name: organization.name,
        email: organization.email,
        type: organization.type,
        status: organization.status,
        created_at: organization.created_at
      };
      
      // Set in Zustand store
      setAuth(orgUser, 'organization');
      
      // Keep localStorage for backward compatibility
      localStorage.setItem('organization_session', JSON.stringify({
        ...orgUser,
        logged_in_at: new Date().toISOString()
      }));

      toast({ title: "Connexion réussie" });
      navigate("/organization/dashboard", { replace: true });
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: err.message || "Impossible de se connecter" 
      });
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/organization/reports`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;
      toast({ title: "Inscription envoyée", description: "Vérifiez votre email pour confirmer." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Inscription impossible" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Espace Organisation</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <form onSubmit={onLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Vous souhaitez inscrire votre organisation ? 
                </p>
                <Button 
                  onClick={() => window.location.href = '/organization/signup'}
                  className="w-full"
                  variant="outline"
                >
                  Créer un compte organisation
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
