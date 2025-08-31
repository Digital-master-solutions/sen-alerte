import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/stores";
import { AUTH_SUCCESS_MESSAGES, getAuthErrorInfo } from "@/utils/auth-messages";

const loginSchema = z.object({
  username: z.string().min(1, "Nom d'utilisateur requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setAuth } = useAuthStore();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      console.log("Tentative de connexion JWT pour:", values.username);
      
      // Try JWT login first
      try {
        const { loginWithJWT } = useAuthStore.getState();
        const result = await loginWithJWT(values.username, values.password, 'admin');
        
        if (result) {
          const { user } = useAuthStore.getState();
          toast({
            title: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS_GENERIC,
            description: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS_ADMIN(user?.name || ''),
          });
          navigate("/admin/dashboard");
          return;
        }
      } catch (jwtError) {
        console.warn("JWT login failed, trying fallback:", jwtError);
      }
      
      // Fallback to RPC authentication
      console.log("Using RPC fallback authentication");
      const { data: adminData, error: authError } = await supabase
        .rpc('authenticate_superadmin', {
          _username: values.username,
          _password_raw: values.password
        });

      if (authError) throw authError;

      if (!adminData || adminData.length === 0) {
        // Authentification échouée - afficher un message générique pour la sécurité
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: "Nom d'utilisateur ou mot de passe incorrect",
        });
        return;
      }

      const superAdmin = adminData[0];
      
      // Vérifier que les données de l'admin sont valides
      if (!superAdmin?.id) {
        throw new Error("Données d'authentification invalides");
      }
      
      const adminUser = {
        id: superAdmin.id,
        username: superAdmin.username,
        name: superAdmin.name,
        email: superAdmin.email,
        status: superAdmin.status,
        created_at: superAdmin.created_at,
        last_login: superAdmin.last_login
      };
      
      setAuth(adminUser, 'admin');

      await supabase.rpc('update_superadmin_last_login', {
        _username: values.username
      });
      
      toast({
        title: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS_GENERIC,
        description: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS_ADMIN(superAdmin.name),
      });

      navigate("/admin/dashboard");

    } catch (error: unknown) {
      console.error("Erreur de connexion:", error);
      
      const errorInfo = getAuthErrorInfo(error);
      
      toast({
        variant: "destructive",
        title: errorInfo.title,
        description: errorInfo.description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              Administration
            </CardTitle>
            <CardDescription>
              Accédez au panneau d'administration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom d'utilisateur</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="admin"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}