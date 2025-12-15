import Header from "@/components/Header";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { User, HouseWithUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserStatus {
  hasHouse: boolean;
  house: {
    x: number;
    y: number;
    size: number;
    lastMovedAt: string;
    canMove: boolean;
  } | null;
}

export default function RealEstateAgency() {
  const { toast } = useToast();
  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/me"],
  });

  const { data: userStatus } = useQuery<UserStatus>({
    queryKey: ["/api/user/status"],
  });

  const { data: houses = [] } = useQuery<HouseWithUser[]>({
    queryKey: ["/api/houses"],
  });

  const userHouse = userStatus?.house && user ? {
    id: "",
    ...userStatus.house,
    userId: user.id,
    username: user.username,
    isCurrentUser: true,
    color: "",
    lastColorChangedAt: new Date(),
    placedAt: new Date(),
    lastMovedAt: new Date(userStatus.house.lastMovedAt),
  } : null;
  const lastMoveTime = userStatus?.house?.lastMovedAt ? new Date(userStatus.house.lastMovedAt) : null;

  const upgradeCost = userHouse ? 100 * (2 ** userHouse.size) : 0;

  const upgradeHouseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/houses/upgrade");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/status"] });
      toast({
        title: "Maison améliorée",
        description: "Votre maison a été agrandie.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de l'amélioration de la maison",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        user={user}
        houseLocation={userHouse ? { x: userHouse.x, y: userHouse.y } : null}
        lastMoveTime={lastMoveTime}
        totalHouses={houses.length}
        gridSize={500}
        showMenuButton={false}
      />
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Agence Immobilière</h1>
          <Button asChild>
            <a href="/">Retour à la grille</a>
          </Button>
        </div>
        <p className="mb-4">Agrandissez votre maison ! Chaque amélioration augmente la taille de votre maison.</p>
        {userHouse && (
          <div className="flex flex-col gap-4">
            <p>Taille actuelle de la maison : {userHouse.size}x{userHouse.size}</p>
            <p>Coût de la prochaine amélioration : {upgradeCost} 🍊</p>
            <Button onClick={() => upgradeHouseMutation.mutate()} disabled={upgradeHouseMutation.isPending}>
              Agrandir la maison
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}