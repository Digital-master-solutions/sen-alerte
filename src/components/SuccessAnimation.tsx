import React, { useEffect, useState } from 'react';
import { CheckCircle, Copy, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface SuccessAnimationProps {
  code: string;
  onContinue: () => void;
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ code, onContinue }) => {
  const [step, setStep] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 500);
    const timer2 = setTimeout(() => setStep(2), 1200);
    const timer3 = setTimeout(() => setStep(3), 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Code copié !",
        description: "Le code de suivi a été copié dans le presse-papiers.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le code automatiquement.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardContent className="p-8 text-center">
          {/* Étape 1: Animation de succès */}
          <div className={`transition-all duration-700 ${step >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 relative overflow-hidden">
              <CheckCircle className="h-12 w-12 text-green-600" />
              {step >= 1 && (
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
              )}
            </div>
          </div>

          {/* Étape 2: Titre et message */}
          <div className={`transition-all duration-700 delay-300 ${step >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Signalement envoyé !
            </h2>
            <p className="text-gray-600 mb-6">
              Votre signalement a été transmis avec succès. Vous recevrez des mises à jour par notification.
            </p>
          </div>

          {/* Étape 3: Code et actions */}
          <div className={`transition-all duration-700 delay-700 ${step >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            {/* Message d'avertissement important */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 mb-4 border border-red-200">
              <p className="text-sm font-semibold text-red-700 mb-2">⚠️ IMPORTANT - À conserver absolument !</p>
              <p className="text-xs text-red-600 leading-relaxed">
                <strong>Copiez et gardez précieusement ce code</strong> - il vous servira à consulter votre signalement et recevoir les notifications. 
                <span className="font-semibold"> Si vous le perdez, vous ne pourrez plus suivre votre signalement !</span>
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-100">
              <p className="text-sm text-gray-600 mb-2">Code de suivi :</p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-xl font-bold text-blue-600 bg-white px-3 py-1 rounded-lg border">
                  {code}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyCode}
                  className="h-8 w-8 p-0 hover:bg-blue-100"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={onContinue}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800 font-medium">
                  💡 <strong>Conseil :</strong> Notez ce code dans votre téléphone, prenez une capture d'écran ou envoyez-le vous par SMS pour ne pas l'oublier !
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuccessAnimation;