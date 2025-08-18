import { CheckCircle } from "lucide-react";

export function SimpleSuccessAnimation() {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center animate-pulse">
        <CheckCircle className="w-8 h-8 text-accent" />
      </div>
    </div>
  );
}