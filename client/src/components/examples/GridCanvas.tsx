import GridCanvas from "../GridCanvas";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function GridCanvasExample() {
  // todo: remove mock functionality
  const mockHouses = [
    { x: 10, y: 10, userId: "user1", isCurrentUser: true },
    { x: 15, y: 12, userId: "user2" },
    { x: 8, y: 20, userId: "user3" },
    { x: 25, y: 5, userId: "user4" },
    { x: 30, y: 30, userId: "user5" },
  ];

  return (
    <TooltipProvider>
      <div className="h-[500px] w-full">
        <GridCanvas
          houses={mockHouses}
          userHouse={mockHouses[0]}
          canPlace={true}
          onCellClick={(x, y) => console.log(`Clicked cell: (${x}, ${y})`)}
        />
      </div>
    </TooltipProvider>
  );
}
