import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/stores/settingsStore";
import { useEffect } from "react";

interface ThemeToggleProps {
  className?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

export const ThemeToggle = ({ 
  className, 
  variant = "ghost", 
  size = "icon" 
}: ThemeToggleProps) => {
  const { display, updateDisplay } = useSettingsStore();
  
  // Déterminer si on est en mode sombre
  const isDark = display.theme === 'dark' || 
    (display.theme === 'system' && 
     typeof window !== 'undefined' && 
     window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Appliquer le thème au montage et lors des changements
  useEffect(() => {
    const html = document.documentElement;
    if (display.theme === 'dark') {
      html.classList.add('dark');
    } else if (display.theme === 'light') {
      html.classList.remove('dark');
    } else {
      // Mode système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.toggle('dark', prefersDark);
    }
  }, [display.theme]);

  // Écouter les changements de préférence système
  useEffect(() => {
    if (display.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [display.theme]);

  const toggleTheme = () => {
    // Cycle: light -> dark -> system -> light
    const nextTheme = display.theme === 'light' ? 'dark' 
      : display.theme === 'dark' ? 'system' 
      : 'light';
    updateDisplay({ theme: nextTheme });
  };

  const getIcon = () => {
    if (display.theme === 'system') {
      return isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />;
    }
    return isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />;
  };

  const getTitle = () => {
    switch (display.theme) {
      case 'light': return 'Mode clair (cliquer pour mode sombre)';
      case 'dark': return 'Mode sombre (cliquer pour mode système)';
      case 'system': return `Mode système (${isDark ? 'sombre' : 'clair'}) - cliquer pour mode clair`;
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={`transition-all duration-300 ${className}`}
      aria-label={getTitle()}
      title={getTitle()}
    >
      <div className="relative">
        <Sun className={`h-5 w-5 transition-all duration-300 ${isDark ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
        <Moon className={`absolute top-0 left-0 h-5 w-5 transition-all duration-300 ${isDark ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
      </div>
    </Button>
  );
};

export default ThemeToggle;
