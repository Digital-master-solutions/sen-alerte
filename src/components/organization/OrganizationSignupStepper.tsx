import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { BasicInfoStep } from "./signup-steps/BasicInfoStep";
import { LocationStep } from "./signup-steps/LocationStep";
import { AccountCreationStep } from "./signup-steps/AccountCreationStep";
import { SimpleSuccessAnimation } from "./SimpleSuccessAnimation";

const STEPS = [
  { id: 1, title: "Informations de base", component: BasicInfoStep },
  { id: 2, title: "Localisation", component: LocationStep },
  { id: 3, title: "Création du compte", component: AccountCreationStep },
];

export interface SignupData {
  name: string;
  type: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  password: string;
}

export function OrganizationSignupStepper() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [signupData, setSignupData] = useState<SignupData>({
    name: "",
    type: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    password: ""
  });

  const updateSignupData = (data: Partial<SignupData>) => {
    setSignupData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(signupData.name && signupData.type && signupData.email && signupData.phone);
      case 2:
        return !!(signupData.address && signupData.city);
      case 3:
        return signupData.password.length >= 6;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    
    setLoading(true);
    try {
      // Hash the password
      const { data: hashedPassword, error: hashError } = await supabase
        .rpc('hash_password', { plain_password: signupData.password });

      if (hashError) {
        throw new Error("Erreur lors du traitement du mot de passe");
      }

      // Create organization with hashed password
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: signupData.name,
          type: signupData.type,
          email: signupData.email,
          phone: signupData.phone,
          address: signupData.address,
          city: signupData.city,
          password_hash: hashedPassword,
          status: 'pending'
        })
        .select()
        .single();

      if (orgError) {
        throw orgError;
      }

      setIsCompleted(true);
      toast({
        title: "Inscription réussie !",
        description: "Votre demande a été envoyée. Elle sera examinée par les administrateurs.",
      });

      // Redirection après animation
      setTimeout(() => {
        navigate("/organization/login");
      }, 3000);

    } catch (err: any) {
      console.error("Erreur d'inscription:", err);
      let errorMessage = "Une erreur est survenue";
      
      if (err.message.includes('duplicate') || err.message.includes('already exists')) {
        errorMessage = "Cette adresse email est déjà utilisée.";
      } else if (err.message.includes('network')) {
        errorMessage = "Erreur de connexion. Vérifiez votre internet.";
      } else if (err.message.includes('violates check constraint "organizations_type_check"')) {
        errorMessage = "Type d'organisation non valide. Veuillez sélectionner un type dans la liste.";
      } else if (err.message.includes('Bad Request') || err.message.includes('400')) {
        errorMessage = "Données invalides. Vérifiez que tous les champs sont correctement remplis.";
      } else if (err.message.includes('violates row-level security')) {
        errorMessage = "Erreur de permissions. Veuillez réessayer dans quelques instants.";
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

  const progress = (currentStep / STEPS.length) * 100;
  const CurrentStepComponent = STEPS[currentStep - 1].component;

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8">
            <SimpleSuccessAnimation />
            <h2 className="text-2xl font-semibold mt-4 mb-2">Inscription réussie !</h2>
            <p className="text-muted-foreground">
              Votre demande d'inscription a été envoyée. Vous recevrez un email de confirmation.
              Vous serez redirigé vers la page de connexion...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">Inscription Organisation</CardTitle>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Étape {currentStep} sur {STEPS.length}</span>
              <span>{STEPS[currentStep - 1].title}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Indicateur d'étapes */}
          <div className="flex justify-between mb-8">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  step.id < currentStep 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : step.id === currentStep
                    ? 'border-primary text-primary'
                    : 'border-muted text-muted-foreground'
                }`}>
                  {step.id < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <span className="text-xs mt-1 text-center max-w-20">{step.title}</span>
              </div>
            ))}
          </div>

          {/* Contenu de l'étape */}
          <div className="animate-fade-in">
            <CurrentStepComponent
              data={signupData}
              updateData={updateSignupData}
              isValid={validateCurrentStep()}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Précédent
            </Button>
            
            {currentStep < STEPS.length ? (
              <Button
                onClick={nextStep}
                disabled={!validateCurrentStep()}
                className="flex items-center gap-2"
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!validateCurrentStep() || loading}
                className="flex items-center gap-2"
              >
                {loading ? "Création..." : "Finaliser l'inscription"}
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}