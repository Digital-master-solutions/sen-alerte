import { cn } from "@/lib/utils";
import logoImage from "@/assets/senalert-logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textPosition?: "right" | "bottom";
  className?: string;
}

const sizeConfig = {
  sm: { image: "w-6 h-6", text: "text-sm" },
  md: { image: "w-8 h-8", text: "text-base" },
  lg: { image: "w-10 h-10", text: "text-lg" },
  xl: { image: "w-12 h-12", text: "text-xl" }
};

export function Logo({ 
  size = "md", 
  showText = true, 
  textPosition = "right",
  className 
}: LogoProps) {
  const config = sizeConfig[size];
  
  const logoContent = (
    <>
      <img 
        src={logoImage} 
        alt="SenAlert Logo" 
        className={cn(config.image, "object-contain")}
      />
      {showText && (
        <div className={cn(
          textPosition === "bottom" ? "text-center" : "",
        )}>
          <div className={cn("font-bold", config.text)}>
            <span className="text-primary">Sen</span>
            <span className="text-foreground">Alert</span>
          </div>
          {size !== "sm" && (
            <div className="text-xs text-muted-foreground">
              Plateforme citoyenne
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className={cn(
      "flex items-center",
      textPosition === "right" ? "gap-3" : "flex-col gap-2",
      className
    )}>
      {logoContent}
    </div>
  );
}