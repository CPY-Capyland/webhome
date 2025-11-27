import CooldownTimer from "../CooldownTimer";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function CooldownTimerExample() {
  // todo: remove mock functionality
  const mockLastMoveTime = new Date(Date.now() - 20 * 60 * 60 * 1000);

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">No house:</span>
          <CooldownTimer lastMoveTime={null} houseLocation={null} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Can move:</span>
          <CooldownTimer
            lastMoveTime={new Date(Date.now() - 25 * 60 * 60 * 1000)}
            houseLocation={{ x: 125, y: 250 }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Cooldown:</span>
          <CooldownTimer
            lastMoveTime={mockLastMoveTime}
            houseLocation={{ x: 125, y: 250 }}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
