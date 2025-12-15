import Header from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import type { User, HouseWithUser } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface UserStatus {
  hasHouse: boolean;
  house: {
    x: number;
    y: number;
    lastMovedAt: string;
    canMove: boolean;
  } | null;
}

export default function RealEstateAgency() {
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
        <h1 className="text-2xl font-bold mb-4">Agence Immobilière</h1>
        <p>Agrandissez votre maison !</p>
        <Button className="mt-4">Agrandir la maison</Button>
      </div>
    </div>
  );
}