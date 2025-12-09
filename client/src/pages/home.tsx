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
import type { House, LawWithVotes, User } from "@shared/schema";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileMenu from "@/components/MobileMenu";

type MobileView = "grid" | "laws" | "propose" | "feed";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("grid");

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
  const { data: laws = [] } = useQuery<LawWithVotes[]>({
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
  const userHouse = userStatus?.house ? {
    x: userStatus.house.x,
    y: userStatus.house.y,
    userId: user?.id || "current-user",
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

  const handleConfirmPlacement = useCallback(() => {
    if (!placementCoords) return;
    placeHouseMutation.mutate(placementCoords);
  }, [placementCoords, placeHouseMutation]);

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
      if (isMobile) {
        setMobileView("laws");
      }
    },
    [user, suggestionMutation, toast, isMobile]
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
  
  const handleMenuClick = () => {
    if (mobileView === "grid") {
      setMobileView("laws");
    }
    setIsMenuOpen(true);
  };

  const renderMobileView = () => {
    switch (mobileView) {
      case "laws":
        return (
          <GovernanceSidebar
            laws={transformedLaws}
            canVote={hasHouse}
            totalHouses={houses.length}
            onVote={handleVote}
          />
        );
      case "propose":
        return (
          <SuggestionForm
            canSuggest={hasHouse}
            onSuggestionSubmit={handleSuggestionSubmit}
          />
        );
      case "feed":
        return <div className="p-4">Nouveautés à venir...</div>;
      default:
        return null;
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
          onMenuClick={handleMenuClick}
          showMenuButton={isMobile}
        />

        <div className="flex-1 flex overflow-hidden">
          <GridCanvas
            houses={houses}
            userHouse={userHouse as any}
            canPlace={canPlace}
            onCellClick={handleCellClick}
          />

          {isMobile ? (
            <MobileMenu
              isOpen={isMenuOpen}
              onOpenChange={setIsMenuOpen}
              currentView={mobileView}
              onNavigate={(view) => {
                if (view === 'grid') {
                  setIsMenuOpen(false);
                }
                setMobileView(view);
              }}
            >
              {renderMobileView()}
            </MobileMenu>
          ) : (
            <GovernanceSidebar
              laws={transformedLaws}
              canVote={hasHouse}
              canSuggest={hasHouse}
              totalHouses={houses.length}
              onVote={handleVote}
              onSuggestionSubmit={handleSuggestionSubmit}
            />
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


