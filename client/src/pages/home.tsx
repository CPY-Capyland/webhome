import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import GridCanvas from "@/components/GridCanvas";
import GovernanceSidebar from "@/components/GovernanceSidebar";
import PlacementModal from "@/components/PlacementModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  const { data: laws = [] } = useQuery<Law[]>({
    queryKey: ["/api/laws"],
  });

  // Fetch jobs
  const { data: jobs = [] } = useQuery<any[]>({
    queryKey: ["/api/jobs"],
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

  // Change house color mutation
  const changeColorMutation = useMutation({
    mutationFn: async ({ color }: { color: string }) => {
      const res = await apiRequest("POST", "/api/houses/color", { color });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/houses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/houses/mine"] });
      toast({
        title: "Couleur de la maison modifiée",
        description: "La couleur de votre maison a été mise à jour.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec du changement de couleur",
        variant: "destructive",
      });
    },
  });

  // Delete house mutation
  const deleteHouseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/houses");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/houses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/houses/mine"] });
      toast({
        title: "Maison supprimée",
        description: "Votre maison a été supprimée.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de la suppression de la maison",
        variant: "destructive",
      });
    },
  });

  const hasHouse = userStatus?.hasHouse ?? false;
  const canPlace = !hasHouse || (userStatus?.house?.canMove ?? true);
  const userHouse: HouseWithUser | null = userStatus?.house && user ? {
    id: "", // This is not available here, but it's not used in the GridCanvas
    ...userStatus.house,
    userId: user.id,
    username: user.username,
    isCurrentUser: true,
    color: "", // This is not available here, but it's not used for the current user's house
    lastColorChangedAt: new Date(), // This is not available here
    placedAt: new Date(), // This is not available here
    lastMovedAt: new Date(userStatus.house.lastMovedAt),
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

  const onMoveHouse = () => {
    setIsPlacementModalOpen(true);
  };

  const onAccessJobs = () => {
    window.location.href = "/jobs";
  };

  const onChangeColor = () => {
    // For now, the color picker is in the sidebar
  };

  const onDeleteHouse = () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer votre maison ?")) {
      deleteHouseMutation.mutate();
    }
  };

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
              canSuggest={canSuggest}
              onVote={handleVote}
              onSuggestionSubmit={handleSuggestionSubmit}
            />
          ) : (
            <>
              <div className="flex-1 min-w-0" style={{ height: "calc(100vh - 4rem)" }}>
                <GridCanvas
                  houses={houses}
                  userHouse={userHouse}
                  canPlace={canPlace}
                  onCellClick={handleCellClick}
                  onMoveHouse={onMoveHouse}
                  onAccessJobs={onAccessJobs}
                  onChangeColor={onChangeColor}
                  onDeleteHouse={onDeleteHouse}
                />
              </div>
              <GovernanceSidebar
                laws={laws}
                canVote={hasHouse}
                canSuggest={hasHouse}
                totalHouses={houses.length}
                onVote={handleVote}
                onSuggestionSubmit={handleSuggestionSubmit}
                userHouse={userHouse}
                onChangeColor={(color) => changeColorMutation.mutate({ color })}
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
          jobs={jobs}
          user={user}
        />
      </div>
    </TooltipProvider>
  );
}