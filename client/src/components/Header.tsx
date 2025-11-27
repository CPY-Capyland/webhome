import { Home, Grid3X3, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CooldownTimer from "./CooldownTimer";
import { useState, useEffect } from "react";

interface HeaderProps {
  houseLocation: { x: number; y: number } | null;
  lastMoveTime: Date | null;
  totalHouses: number;
  gridSize: number;
}

export default function Header({
  houseLocation,
  lastMoveTime,
  totalHouses,
  gridSize,
}: HeaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
          <Grid3X3 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-serif font-bold text-lg leading-tight">
            Grille Civique
          </h1>
          <p className="text-xs text-muted-foreground">
            Gouvernance Communautaire
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Home className="h-4 w-4" />
            <span>
              {totalHouses.toLocaleString()} / {(gridSize * gridSize).toLocaleString()}
            </span>
          </div>
        </div>

        <Separator orientation="vertical" className="h-8 hidden sm:block" />

        <CooldownTimer
          lastMoveTime={lastMoveTime}
          houseLocation={houseLocation}
        />

        <Button
          size="icon"
          variant="ghost"
          onClick={toggleTheme}
          data-testid="button-theme-toggle"
        >
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
