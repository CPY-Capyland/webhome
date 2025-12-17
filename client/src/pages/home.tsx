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
import MoveModal from "@/components/MoveModal";

interface UserStatus {
  hasHouse: boolean;
  house: {
    x: number;
    y: number;
    color: string;
    size: number;
    expansionUnits: number;
    lastMovedAt: string;
    canMove: boolean;
  } | null;
}

export default function Home() {
  const { toast } = useToast();
  const [placementCoords, setPlacementCoords] = useState<{ x: number; y: number } | null>(null);
  const [isPlacementModalOpen, setIsPlacementModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUserHouse, setSelectedUserHouse] = useState<HouseWithUser | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [isUpgradeMode, setIsUpgradeMode] = useState(false);
  const [isHouseMenuOpen, setIsHouseMenuOpen] = useState(false);


  // Fetch current user
  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/me"],
  });

  // Fetch user search results
  const { data: userSearchResults = [] } = useQuery<HouseWithUser[]>({
    queryKey: ["/api/users/search", userSearchQuery],
    queryFn: () => apiRequest("GET", `/api/users/search?username=${userSearchQuery}`).then(res => res.json()),
    enabled: !!userSearchQuery, // Only run the query if userSearchQuery is not empty
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
      queryClient.invalidateQueries({ queryKey: ["/api/user/status"] });
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
    color: userStatus.house.color,
    expansion: userStatus.house.expansion || [],
    expansionUnits: userStatus.house.expansionUnits,
    lastColorChangedAt: new Date(), // This is not available here
    placedAt: new Date(), // This is not available here
    lastMovedAt: new Date(userStatus.house.lastMovedAt),
  } : null;
  const lastMoveTime = userStatus?.house?.lastMovedAt ? new Date(userStatus.house.lastMovedAt) : null;

  const handleCellSelect = useCallback((cell: { x: number; y: number } | null) => {
    setSelectedCell(cell);
  }, []);

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
    if (selectedCell) {
      setPlacementCoords(selectedCell);
      setIsPlacementModalOpen(true);
    } else {
      setIsMoveModalOpen(true);
    }
  };

  const onAccessJobs = () => {
    window.location.href = "/jobs";
  };

  const onDeleteHouse = () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer votre maison ?")) {
      deleteHouseMutation.mutate();
    }
  };

  const onManageUpgrades = () => {
    setIsUpgradeMode(!isUpgradeMode);
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
          onOpenHouseMenu={() => setIsHouseMenuOpen(true)}
        />

        <div className="flex-1 flex flex-row">
          {isMobile ? (
            <MobileContainer
              user={user}
              houses={houses}
              userHouse={userHouse}
              canPlace={canPlace}
              onCellClick={handleCellSelect}
              laws={laws}
              hasHouse={hasHouse}
              canSuggest={hasHouse}
              onVote={handleVote}
              onSuggestionSubmit={handleSuggestionSubmit}
              onUserSearch={setUserSearchQuery}
              userSearchResults={userSearchResults}
              onUserSelect={setSelectedUserHouse}
            />
          ) : (
            <>
              <div className="flex-1">
                <GridCanvas
                  houses={houses}
                  userHouse={userHouse}
                  canPlace={canPlace}
                  onCellSelect={handleCellSelect}
                  onMoveHouse={onMoveHouse}
                  onAccessJobs={onAccessJobs}
                  onChangeColor={(color) => changeColorMutation.mutate({ color })}
                  onDeleteHouse={onDeleteHouse}
                  onManageUpgrades={onManageUpgrades}
                  isUpgradeMode={isUpgradeMode}
                  selectedUserHouse={selectedUserHouse}
                  userHasNoHouse={!hasHouse}
                  setSelectedCell={setSelectedCell}
                  setIsPlacementModalOpen={setIsPlacementModalOpen}
                  setPlacementCoords={setPlacementCoords}
                  isHouseMenuOpen={isHouseMenuOpen}
                  setIsHouseMenuOpen={setIsHouseMenuOpen}
                />
              </div>
              <div>
                <GovernanceSidebar
                  laws={laws}
                  canVote={hasHouse}
                  canSuggest={hasHouse}
                  totalHouses={houses.length}
                  onVote={handleVote}
                  onSuggestionSubmit={handleSuggestionSubmit}
                  userHouse={userHouse}
                  onChangeColor={(color) => changeColorMutation.mutate({ color })}
                  onUserSearch={setUserSearchQuery}
                  userSearchResults={userSearchResults}
                  onUserSelect={setSelectedUserHouse}
                />
              </div>
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
        <MoveModal
          isOpen={isMoveModalOpen}
          onClose={() => setIsMoveModalOpen(false)}
          onConfirm={(x, y) => {
            setPlacementCoords({ x, y });
            setIsPlacementModalOpen(true);
          }}
        />
      </div>
    </TooltipProvider>
  );
}
