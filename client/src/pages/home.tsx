import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import GridCanvas from "@/components/GridCanvas";
import GovernanceSidebar from "@/components/GovernanceSidebar";
import PlacementModal from "@/components/PlacementModal";
import type { House, LawWithVotes as Law, User, HouseWithUser } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileContainer from "@/components/MobileContainer";

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

  // Fetch current user
  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/me"],
  });

  // Fetch user status
  const { data: userStatus } = useQuery<UserStatus>({
    queryKey: ["/api/user/status"],
  });

  // Fetch all houses
  const { data: houses = [] } = useQuery<HouseWithUser[]>({
    queryKey: ["/api/houses"],
  });

  // Fetch laws
  const { data: laws = [] } = useQuery<Law[]>({ // Changed LawWithVotes[] to Law[]
    queryKey: ["/api/laws"],
  });

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
      setIsPlacementModalOpen(false); // Added to close modal on success
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
      queryClient.invalidateQueries({ queryKey: ["/api/laws"] });
      toast({
        title: "Loi publiée",
        description: "Votre proposition de loi a été publiée et est maintenant visible par tous.",
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
  const userHouse = userStatus?.house && user ? { // Added '&& user'
    x: userStatus.house.x,
    y: userStatus.house.y,
    userId: user.id, // Changed from user?.id || "current-user"
    username: user.username, // Added username
    isCurrentUser: true,
  } : null;
  const lastMoveTime = userStatus?.house?.lastMovedAt ? new Date(userStatus.house.lastMovedAt) : null;

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (!user) {
        toast({
          title: "Connexion requise",
          description: "Vous devez vous connecter avec Discord pour placer une maison.",
          variant: "destructive",
        });
        return;
      }

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
    [user, canPlace, houses, toast]
  );

  const handleConfirmPlacement = useCallback(
    () => {
      if (!placementCoords) return;
      placeHouseMutation.mutate(placementCoords);
    },
    [placementCoords, placeHouseMutation]
  );

  const handleVote = useCallback(
    (lawId: string, vote: "up" | "down" | null) => {
      if (!user) {
        toast({
          title: "Connexion requise",
          description: "Vous devez vous connecter pour voter.",
          variant: "destructive",
        });
        return;
      }
      voteMutation.mutate({ lawId, vote });
    },
    [user, voteMutation, toast]
  );

  const isMobile = useIsMobile();

  const handleSuggestionSubmit = useCallback(
    (title: string, text: string) => {
      if (!user) {
        toast({
          title: "Connexion requise",
          description: "Vous devez vous connecter pour faire une proposition.",
          variant: "destructive",
        });
        return;
      }
      suggestionMutation.mutate({ title, text });
    },
    [user, suggestionMutation, toast]
  );

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        <Header
          user={user}
          houseLocation={userHouse ? { x: userHouse.x, y: userHouse.y } : null}
          lastMoveTime={lastMoveTime}
          totalHouses={houses.length}
          gridSize={500}
          showMenuButton={false} // No menu button in this new layout
        />

        <div className="flex-1 flex overflow-hidden">
          {isMobile ? (
            <MobileContainer
              user={user}
              houses={houses}
              userHouse={userHouse}
              canPlace={canPlace}
              onCellClick={handleCellClick}
              laws={laws}
              hasHouse={hasHouse}
              onVote={handleVote}
              onSuggestionSubmit={handleSuggestionSubmit}
            />
          ) : (
            <>
              <GridCanvas
                houses={houses}
                userHouse={userHouse}
                canPlace={canPlace}
                onCellClick={handleCellClick}
              />
              <GovernanceSidebar
                laws={laws}
                canVote={hasHouse}
                canSuggest={hasHouse}
                totalHouses={houses.length}
                onVote={handleVote}
                onSuggestionSubmit={handleSuggestionSubmit}
              />
            </>
          )}
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


