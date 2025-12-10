import { Home, Grid3X3, Moon, Sun, LogIn, LogOut, Menu, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CooldownTimer from "./CooldownTimer";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@shared/schema";

interface HeaderProps {
  user: User | null | undefined;
  houseLocation: { x: number; y: number } | null;
  lastMoveTime: Date | null;
  totalHouses: number;
  gridSize: number;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export default function Header({
  user,
  houseLocation,
  lastMoveTime,
  totalHouses,
  gridSize,
  onMenuClick,
  showMenuButton,
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
        {showMenuButton && (
          <Button size="icon" variant="ghost" onClick={onMenuClick}>
            <Menu className="h-6 w-6" />
          </Button>
        )}
        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
          <Grid3X3 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Capyland</h1>
          <p className="text-sm text-gray-500">Carte habitable et espace politique</p>
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

        <Button
          size="icon"
          variant="ghost"
          asChild
          data-testid="button-github"
        >
          <a href="https://github.com/CPY-Capyland/webhome" target="_blank">
            <Github className="h-4 w-4" />
          </a>
        </Button>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar || ""} alt={user.username} />
                  <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem disabled>
                <p className="font-medium">{user.username}</p>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/auth/logout'}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild>
            <a href="/auth/discord">
              <LogIn className="mr-2 h-4 w-4" />
              Login with Discord
            </a>
          </Button>
        )}
      </div>
    </header>
  );
}

