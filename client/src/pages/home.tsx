import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import GridCanvas from "@/components/GridCanvas";
import GovernanceSidebar from "@/components/GovernanceSidebar";
import PlacementModal from "@/components/PlacementModal";
import { type Law } from "@/components/LawCard";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { House, LawWithVotes } from "@shared/schema";

interface HouseWithUser extends House {
  isCurrentUser?: boolean;
}

interface UserStatus {
  hasHouse: boolean;
  house: {
    x: number;
    y: number;
    lastMovedAt: string;
    canMove: boolean;
  } | null;
}

export default function Home() {
  const { toast } = useToast();
  const [placementCoords, setPlacementCoords] = useState<{ x: number; y: number } | null>(null);
  const [isPlacementModalOpen, setIsPlacementModalOpen] = useState(false);

  // Fetch user status
  const { data: userStatus } = useQuery<UserStatus>({
    queryKey: ["/api/user/status"],
  });

  // Fetch all houses
  const { data: houses = [] } = useQuery<HouseWithUser[]>({
    queryKey: ["/api/houses"],
  });

  // Fetch laws
  const { data: laws = [] } = useQuery<LawWithVotes[]>({
    queryKey: ["/api/laws"],
  });

  // Seed laws if none exist
  useEffect(() => {
    if (laws.length === 0) {
      apiRequest("POST", "/api/admin/seed-laws").then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/laws"] });
      }).catch(() => {});
    }
  }, [laws.length]);

  // Place/move house mutation
  const placeHouseMutation = useMutation({
    mutationFn: async ({ x, y }: { x: number; y: number }) => {
      const res = await apiRequest("POST", "/api/houses", { x, y });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/houses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/houses/mine"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec du placement de la maison",
        variant: "destructive",
      });
    },
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ lawId, vote }: { lawId: string; vote: "up" | "down" | null }) => {
      const res = await apiRequest("POST", `/api/laws/${lawId}/vote`, { vote });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/laws"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec du vote",
        variant: "destructive",
      });
    },
  });

  // Suggestion mutation
  const suggestionMutation = useMutation({
    mutationFn: async ({ title, text }: { title: string; text: string }) => {
      const res = await apiRequest("POST", "/api/suggestions", { title, text });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Proposition soumise",
        description: "Votre proposition a été envoyée au gouvernement pour examen.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de la soumission",
        variant: "destructive",
      });
    },
  });

  const hasHouse = userStatus?.hasHouse ?? false;
  const canPlace = !hasHouse || (userStatus?.house?.canMove ?? true);
  const userHouse = userStatus?.house ? {
    x: userStatus.house.x,
    y: userStatus.house.y,
    userId: "current-user",
    isCurrentUser: true,
  } : null;
  const lastMoveTime = userStatus?.house?.lastMovedAt ? new Date(userStatus.house.lastMovedAt) : null;

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (!canPlace) {
        toast({
          title: "Délai actif",
          description: "Vous devez attendre avant de pouvoir déplacer votre maison à nouveau.",
          variant: "destructive",
        });
        return;
      }

      const isOccupied = houses.some((h) => h.x === x && h.y === y);
      if (isOccupied) {
        toast({
          title: "Espace occupé",
          description: "Cet emplacement a déjà une maison.",
          variant: "destructive",
        });
        return;
      }

      setPlacementCoords({ x, y });
      setIsPlacementModalOpen(true);
    },
    [canPlace, houses, toast]
  );

  const handleConfirmPlacement = useCallback(() => {
    if (!placementCoords) return;
    placeHouseMutation.mutate(placementCoords);
  }, [placementCoords, placeHouseMutation]);

  const handleVote = useCallback(
    (lawId: string, vote: "up" | "down" | null) => {
      voteMutation.mutate({ lawId, vote });
    },
    [voteMutation]
  );

  const handleSuggestionSubmit = useCallback(
    (title: string, text: string) => {
      suggestionMutation.mutate({ title, text });
    },
    [suggestionMutation]
  );

  // Transform laws for UI component
  const transformedLaws: Law[] = laws.map((law) => ({
    id: law.id,
    title: law.title,
    description: law.description,
    fullText: law.fullText,
    publishedAt: typeof law.publishedAt === 'string' ? law.publishedAt : law.publishedAt.toISOString(),
    status: law.status as "active" | "pending" | "passed" | "rejected",
    upvotes: law.upvotes,
    downvotes: law.downvotes,
    userVote: law.userVote,
  }));

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        <Header
          houseLocation={userHouse ? { x: userHouse.x, y: userHouse.y } : null}
          lastMoveTime={lastMoveTime}
          totalHouses={houses.length}
          gridSize={500}
        />

        <div className="flex-1 flex overflow-hidden">
          <GridCanvas
            houses={houses}
            userHouse={userHouse as any}
            canPlace={canPlace}
            onCellClick={handleCellClick}
          />

          <GovernanceSidebar
            laws={transformedLaws}
            canVote={hasHouse}
            canSuggest={hasHouse}
            totalHouses={houses.length}
            onVote={handleVote}
            onSuggestionSubmit={handleSuggestionSubmit}
          />
        </div>

        <PlacementModal
          isOpen={isPlacementModalOpen}
          onClose={() => setIsPlacementModalOpen(false)}
          coordinates={placementCoords}
          isMove={hasHouse}
          onConfirm={handleConfirmPlacement}
        />
      </div>
    </TooltipProvider>
  );
}
