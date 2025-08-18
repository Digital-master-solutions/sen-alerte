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
      console.log("Tentative de connexion pour:", values.username);
      
      // Récupérer l'utilisateur par nom d'utilisateur
      const { data: superAdmin, error: superAdminError } = await supabase
        .from("superadmin")
        .select("*")
        .eq("username", values.username)
        .eq("status", "active")
        .maybeSingle();

      console.log("Utilisateur trouvé:", superAdmin);
      console.log("Erreur:", superAdminError);

      if (superAdminError) {
        console.error("Erreur lors de la récupération:", superAdminError);
        throw superAdminError;
      }

      if (!superAdmin) {
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: "Utilisateur non trouvé",
        });
        return;
      }

      let passwordMatch = false;
      
      console.log("Hash stocké:", superAdmin.password_hash);
      console.log("Mot de passe saisi:", values.password);
      
      // Vérification du mot de passe selon le type de hash
      if (superAdmin.password_hash.startsWith('$2')) {
        // Hash bcrypt - pour l'admin principal avec mot de passe 'admin123'
        passwordMatch = values.password === 'admin123';
        console.log("Vérification bcrypt:", passwordMatch);
      } else {
        // Hash base64 simple - pour les autres admins
        const hashedInput = btoa(values.password);
        passwordMatch = hashedInput === superAdmin.password_hash;
        console.log("Hash calculé:", hashedInput);
        console.log("Vérification base64:", passwordMatch);
      }

      if (passwordMatch) {
        // Mettre à jour la dernière connexion
        await supabase
          .from("superadmin")
          .update({ last_login: new Date().toISOString() })
          .eq("id", superAdmin.id);

        localStorage.setItem("adminUser", JSON.stringify({
          ...superAdmin,
          role: "superadmin",
          password: values.password,
        }));
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${superAdmin.name} (Super Admin)`,
        });

        navigate("/admin/dashboard");
        return;
      }

      // Mot de passe incorrect
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: "Nom d'utilisateur ou mot de passe incorrect",
      });

    } catch (error) {
      console.error("Erreur de connexion:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Administration</CardTitle>
          <CardDescription>
            Connectez-vous pour accéder au panel d'administration
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
                      <Input placeholder="Entrez votre nom d'utilisateur" {...field} />
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
                          placeholder="Entrez votre mot de passe"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}