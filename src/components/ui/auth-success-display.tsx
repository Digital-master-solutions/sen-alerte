import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, User, Shield } from "lucide-react";

interface AuthSuccessDisplayProps {
  title: string;
  description: string;
  userType?: 'admin' | 'organization';
  className?: string;
}

export function AuthSuccessDisplay({ 
  title, 
  description, 
  userType, 
  className = "" 
}: AuthSuccessDisplayProps) {
  
  const getSuccessIcon = () => {
    if (userType === 'admin') {
      return <Shield className="h-4 w-4" />;
    }
    if (userType === 'organization') {
      return <User className="h-4 w-4" />;
    }
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <Alert className={`border-green-200 bg-green-50 text-green-800 ${className}`}>
      {getSuccessIcon()}
      <AlertTitle className="text-green-800">{title}</AlertTitle>
      <AlertDescription className="text-green-700">{description}</AlertDescription>
    </Alert>
  );
}
