import Header from "../Header";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function HeaderExample() {
  // todo: remove mock functionality
  return (
    <TooltipProvider>
      <Header
        houseLocation={{ x: 125, y: 250 }}
        lastMoveTime={new Date(Date.now() - 20 * 60 * 60 * 1000)}
        totalHouses={1247}
        gridSize={500}
      />
    </TooltipProvider>
  );
}
