import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Shield, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { SignupData } from "../OrganizationSignupStepper";
import { usePasswordBreachCheck } from "@/hooks/usePasswordBreachCheck";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AccountCreationStepProps {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  isValid: boolean;
}

export function AccountCreationStep({ data, updateData }: AccountCreationStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [breachWarning, setBreachWarning] = useState<{ breached: boolean; count: number } | null>(null);
  const { checkPassword, isChecking } = usePasswordBreachCheck();

  const passwordRequirements = [
    { text: "Au moins 12 caractères", valid: data.password.length >= 12 },
    { text: "Contient une minuscule", valid: /[a-z]/.test(data.password) },
    { text: "Contient une majuscule", valid: /[A-Z]/.test(data.password) },
    { text: "Contient un chiffre", valid: /\d/.test(data.password) },
    { text: "Contient un caractère spécial", valid: /[!@#$%^&*(),.?":{}|<>]/.test(data.password) },
  ];

  const handlePasswordChange = async (newPassword: string) => {
    updateData({ password: newPassword });
    
    if (newPassword.length >= 8) {
      const result = await checkPassword(newPassword);
      setBreachWarning(result);
    } else {
      setBreachWarning(null);
    }
  };

  const passwordsMatch = data.password === confirmPassword && confirmPassword.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Création du compte</h3>
        <p className="text-muted-foreground">
          Choisissez un mot de passe sécurisé pour votre compte
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Choisissez un mot de passe sécurisé"
              value={data.password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className="pr-10 transition-all duration-200 focus:scale-105"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Confirmez votre mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="transition-all duration-200 focus:scale-105"
          />
          {confirmPassword.length > 0 && (
            <div className={`flex items-center gap-2 text-sm ${
              passwordsMatch ? 'text-accent' : 'text-destructive'
            }`}>
              {passwordsMatch ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {passwordsMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
            </div>
          )}
        </div>
      </div>

      {/* Alerte de compromission */}
      {breachWarning && breachWarning.breached && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ⚠️ Ce mot de passe a été compromis dans {breachWarning.count.toLocaleString()} fuites de données. 
            Veuillez en choisir un autre pour votre sécurité.
          </AlertDescription>
        </Alert>
      )}

      {/* Exigences du mot de passe */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Exigences du mot de passe
        </Label>
        <div className="space-y-2">
          {passwordRequirements.map((req, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 text-sm transition-colors ${
                req.valid ? 'text-accent' : 'text-muted-foreground'
              }`}
            >
              {req.valid ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {req.text}
            </div>
          ))}
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="bg-muted/30 p-4 rounded-lg space-y-2">
        <h4 className="font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-accent" />
          Récapitulatif de votre inscription
        </h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Organisation :</strong> {data.name} ({data.type})</p>
          <p><strong>Email :</strong> {data.email}</p>
          <p><strong>Localisation :</strong> {data.address}, {data.city}</p>
        </div>
      </div>

      <div className="bg-accent/10 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          🔒 <strong>Sécurité :</strong> Votre compte sera créé et une demande d'approbation sera envoyée aux administrateurs. 
          Vous recevrez un email de confirmation.
        </p>
      </div>
    </div>
  );
}