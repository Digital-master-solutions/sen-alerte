import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Shield, UserX, Clock, WifiOff } from "lucide-react";
import { getAuthErrorInfo } from "@/utils/auth-messages";

interface AuthErrorDisplayProps {
  error: any;
  className?: string;
}

export function AuthErrorDisplay({ error, className = "" }: AuthErrorDisplayProps) {
  const errorInfo = getAuthErrorInfo(error);
  
  // Déterminer l'icône selon le type d'erreur
  const getErrorIcon = () => {
    const message = errorInfo.description.toLowerCase();
    
    if (message.includes("approuvé") || message.includes("en attente")) {
      return <Clock className="h-4 w-4" />;
    }
    
    if (message.includes("désactivé") || message.includes("inactif")) {
      return <UserX className="h-4 w-4" />;
    }
    
    if (message.includes("réseau") || message.includes("internet")) {
      return <WifiOff className="h-4 w-4" />;
    }
    
    if (message.includes("administrateur")) {
      return <Shield className="h-4 w-4" />;
    }
    
    return <AlertCircle className="h-4 w-4" />;
  };

  return (
    <Alert variant="destructive" className={className}>
      {getErrorIcon()}
      <AlertTitle>{errorInfo.title}</AlertTitle>
      <AlertDescription>{errorInfo.description}</AlertDescription>
    </Alert>
  );
}
