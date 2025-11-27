import { useState, useEffect } from "react";
import { Clock, Home, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CooldownTimerProps {
  lastMoveTime: Date | null;
  cooldownHours?: number;
  houseLocation?: { x: number; y: number } | null;
}

export default function CooldownTimer({
  lastMoveTime,
  cooldownHours = 24,
  houseLocation,
}: CooldownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [canMove, setCanMove] = useState(true);

  useEffect(() => {
    if (!lastMoveTime) {
      setCanMove(true);
      setTimeRemaining("");
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const cooldownEnd = new Date(
        lastMoveTime.getTime() + cooldownHours * 60 * 60 * 1000
      );
      const remaining = cooldownEnd.getTime() - now.getTime();

      if (remaining <= 0) {
        setCanMove(true);
        setTimeRemaining("");
        return;
      }

      setCanMove(false);

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lastMoveTime, cooldownHours]);

  if (!houseLocation) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="gap-1.5" data-testid="badge-no-house">
            <Home className="h-3 w-3" />
            <span>Aucune maison placée</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          Cliquez sur une cellule vide dans la grille pour placer votre maison
        </TooltipContent>
      </Tooltip>
    );
  }

  if (canMove) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="default" className="gap-1.5" data-testid="badge-can-move">
            <MapPin className="h-3 w-3" />
            <span>
              ({houseLocation.x}, {houseLocation.y})
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>Vous pouvez déplacer votre maison vers un nouvel emplacement</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className="gap-1.5" data-testid="badge-cooldown">
          <Clock className="h-3 w-3" />
          <span>{timeRemaining}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-center">
          <p>Maison à ({houseLocation.x}, {houseLocation.y})</p>
          <p className="text-xs text-muted-foreground">
            Vous pourrez déménager dans {timeRemaining}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
