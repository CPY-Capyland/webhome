import Header from "@/components/Header";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { User, HouseWithUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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

export default function Election() {
  const { toast } = useToast();
  const [platform, setPlatform] = useState("");

  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/me"],
  });

  const { data: userStatus } = useQuery<UserStatus>({
    queryKey: ["/api/user/status"],
  });

  const { data: houses = [] } = useQuery<HouseWithUser[]>({
    queryKey: ["/api/houses"],
  });

  const userHouse: HouseWithUser | null = userStatus?.house && user ? {
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

  const becomeCandidateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/elections/candidate", { platform });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/elections/candidate"] });
      toast({
        title: "Candidature enregistrée",
        description: "Vous êtes maintenant candidat.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de l'enregistrement de la candidature",
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
          <h1 className="text-2xl font-bold">Élection</h1>
          <Button asChild>
            <a href="/">Retour à la grille</a>
          </Button>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Devenir candidat</h2>
          <p>Présentez votre profession de foi pour devenir candidat à l'élection.</p>
          <Textarea
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="Écrivez votre profession de foi ici..."
            rows={10}
          />
          <Button onClick={() => becomeCandidateMutation.mutate()} disabled={becomeCandidateMutation.isPending}>
            Devenir candidat
          </Button>
        </div>
      </div>
    </div>
  );
}