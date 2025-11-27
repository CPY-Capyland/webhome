import { useState, useCallback } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import GridCanvas from "@/components/GridCanvas";
import GovernanceSidebar from "@/components/GovernanceSidebar";
import PlacementModal from "@/components/PlacementModal";
import { type Law } from "@/components/LawCard";
import { useToast } from "@/hooks/use-toast";

// todo: remove mock functionality - replace with API calls
const INITIAL_LAWS: Law[] = [
  {
    id: "law-1",
    title: "Community Garden Initiative",
    description:
      "Establish community gardens in empty lots for sustainable food production and community bonding.",
    fullText: `Section 1: Purpose
This law establishes a framework for creating and maintaining community gardens within designated areas of the grid.

Section 2: Eligibility
Any resident with a placed house may apply for a garden plot adjacent to their location.

Section 3: Responsibilities
Garden plot holders must:
- Maintain their plot in good condition
- Follow organic growing practices
- Share excess produce with neighbors

Section 4: Governance
A garden committee of 5 elected residents will oversee operations and resolve disputes.`,
    publishedAt: "2024-11-25",
    status: "active",
    upvotes: 234,
    downvotes: 45,
    userVote: null,
  },
  {
    id: "law-2",
    title: "Quiet Hours Policy",
    description:
      "Implement quiet hours from 10 PM to 7 AM in residential areas to ensure peaceful living.",
    fullText: `Section 1: Quiet Hours
All residents must observe quiet hours between 10:00 PM and 7:00 AM daily.

Section 2: Restrictions
During quiet hours, the following are prohibited:
- Loud music or entertainment
- Construction work
- Outdoor gatherings exceeding 5 people

Section 3: Enforcement
Violations may result in warnings and community service requirements.`,
    publishedAt: "2024-11-20",
    status: "passed",
    upvotes: 456,
    downvotes: 89,
    userVote: "up",
  },
  {
    id: "law-3",
    title: "Public Transit Expansion",
    description:
      "Expand bus routes to cover underserved areas of the grid for better mobility.",
    fullText: `Section 1: Expansion Plan
The public transit authority shall extend service to grid sectors 100-200 and 400-500.

Section 2: Timeline
Implementation to begin within 60 days of passage and complete within 180 days.

Section 3: Funding
Funded through a 0.5% property assessment on all placed houses.`,
    publishedAt: "2024-11-18",
    status: "pending",
    upvotes: 123,
    downvotes: 67,
    userVote: null,
  },
  {
    id: "law-4",
    title: "Renewable Energy Mandate",
    description:
      "Require all new constructions to include solar panels or other renewable energy sources.",
    fullText: `Section 1: Requirements
All new houses placed after passage must include renewable energy systems.

Section 2: Incentives
Existing houses that retrofit will receive property tax credits.

Section 3: Compliance
Houses must generate at least 30% of their energy needs from renewable sources.`,
    publishedAt: "2024-11-15",
    status: "active",
    upvotes: 567,
    downvotes: 234,
    userVote: null,
  },
];

// todo: remove mock functionality
const INITIAL_HOUSES = [
  { x: 15, y: 12, userId: "user2" },
  { x: 8, y: 20, userId: "user3" },
  { x: 25, y: 5, userId: "user4" },
  { x: 30, y: 30, userId: "user5" },
  { x: 45, y: 18, userId: "user6" },
  { x: 22, y: 45, userId: "user7" },
  { x: 50, y: 50, userId: "user8" },
];

interface House {
  x: number;
  y: number;
  userId: string;
  isCurrentUser?: boolean;
}

export default function Home() {
  const { toast } = useToast();
  const [laws, setLaws] = useState<Law[]>(INITIAL_LAWS);
  const [houses, setHouses] = useState<House[]>(INITIAL_HOUSES);
  const [userHouse, setUserHouse] = useState<House | null>(null);
  const [lastMoveTime, setLastMoveTime] = useState<Date | null>(null);
  const [placementCoords, setPlacementCoords] = useState<{ x: number; y: number } | null>(null);
  const [isPlacementModalOpen, setIsPlacementModalOpen] = useState(false);

  const COOLDOWN_HOURS = 24;
  const now = new Date();
  const cooldownEnd = lastMoveTime
    ? new Date(lastMoveTime.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000)
    : null;
  const canMove = !cooldownEnd || now >= cooldownEnd;
  const canPlace = !userHouse || canMove;
  const hasHouse = !!userHouse;

  const allHouses = userHouse
    ? [...houses, { ...userHouse, isCurrentUser: true }]
    : houses;

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (!canPlace) {
        toast({
          title: "Cooldown Active",
          description: "You must wait before moving your house again.",
          variant: "destructive",
        });
        return;
      }

      const isOccupied = allHouses.some((h) => h.x === x && h.y === y);
      if (isOccupied) {
        toast({
          title: "Space Occupied",
          description: "This location already has a house.",
          variant: "destructive",
        });
        return;
      }

      setPlacementCoords({ x, y });
      setIsPlacementModalOpen(true);
    },
    [canPlace, allHouses, toast]
  );

  const handleConfirmPlacement = useCallback(() => {
    if (!placementCoords) return;

    const newHouse: House = {
      x: placementCoords.x,
      y: placementCoords.y,
      userId: "current-user",
      isCurrentUser: true,
    };

    setUserHouse(newHouse);
    setLastMoveTime(new Date());
  }, [placementCoords]);

  const handleVote = useCallback(
    (lawId: string, vote: "up" | "down" | null) => {
      setLaws((prev) =>
        prev.map((law) =>
          law.id === lawId ? { ...law, userVote: vote } : law
        )
      );
    },
    []
  );

  const handleSuggestionSubmit = useCallback(
    (title: string, text: string) => {
      console.log("Suggestion submitted:", { title, text });
      // todo: replace with API call
    },
    []
  );

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        <Header
          houseLocation={userHouse ? { x: userHouse.x, y: userHouse.y } : null}
          lastMoveTime={lastMoveTime}
          totalHouses={allHouses.length}
          gridSize={500}
        />

        <div className="flex-1 flex overflow-hidden">
          <GridCanvas
            houses={allHouses}
            userHouse={userHouse}
            canPlace={canPlace}
            onCellClick={handleCellClick}
          />

          <GovernanceSidebar
            laws={laws}
            canVote={hasHouse}
            canSuggest={hasHouse}
            totalHouses={allHouses.length}
            onVote={handleVote}
            onSuggestionSubmit={handleSuggestionSubmit}
          />
        </div>

        <PlacementModal
          isOpen={isPlacementModalOpen}
          onClose={() => setIsPlacementModalOpen(false)}
          coordinates={placementCoords}
          isMove={!!userHouse}
          onConfirm={handleConfirmPlacement}
        />
      </div>
    </TooltipProvider>
  );
}
