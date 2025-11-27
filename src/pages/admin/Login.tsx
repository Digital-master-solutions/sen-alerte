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
import { Shield, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/stores";
import { AUTH_SUCCESS_MESSAGES, getAuthErrorInfo } from "@/utils/auth-messages";
import { usePasswordBreachCheck } from "@/hooks/usePasswordBreachCheck";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email("Email invalide").min(1, "Email requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordWarning, setPasswordWarning] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setAuth } = useAuthStore();
  const { checkPassword } = usePasswordBreachCheck();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setPasswordWarning(null);
    
    try {
      // Check if password has been breached
      const breachCheck = await checkPassword(values.password);
      if (breachCheck.breached) {
        setPasswordWarning(
          `This password has been found in ${breachCheck.count.toLocaleString()} data breaches. Please use a different password for better security.`
        );
        setIsLoading(false);
        return;
      }
      
      // Use Supabase Auth login
      const { loginWithSupabase } = useAuthStore.getState();
      await loginWithSupabase(values.email, values.password, 'admin');
      
      const { profile } = useAuthStore.getState();
      toast({
        title: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS_GENERIC,
        description: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS_ADMIN(profile?.name || ''),
      });
      navigate("/securepass/dashboard");

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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@example.com"
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
                
                {passwordWarning && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{passwordWarning}</AlertDescription>
                  </Alert>
                )}
                
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