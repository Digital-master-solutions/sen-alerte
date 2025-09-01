import { cn } from "@/lib/utils";
import logoImage from "/logo-bi.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showText?: boolean;
  textPosition?: "right" | "bottom";
  className?: string;
}

const sizeConfig = {
  sm: { image: "w-6 h-6", text: "text-sm" },
  md: { image: "w-8 h-8", text: "text-base" },
  lg: { image: "w-10 h-10", text: "text-lg" },
  xl: { image: "w-12 h-12", text: "text-xl" },
  "2xl": { image: "w-16 h-16", text: "text-2xl" }
};

export function Logo({ 
  size = "md", 
  showText = false, 
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
          <div className={cn("font-bold text-primary", config.text)}>
            SenAlert
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