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
    title: "Initiative des Jardins Communautaires",
    description:
      "Établir des jardins communautaires dans les terrains vides pour une production alimentaire durable et le renforcement des liens communautaires.",
    fullText: `Article 1 : Objectif
Cette loi établit un cadre pour la création et l'entretien de jardins communautaires dans les zones désignées de la grille.

Article 2 : Éligibilité
Tout résident ayant une maison placée peut demander une parcelle de jardin adjacente à son emplacement.

Article 3 : Responsabilités
Les détenteurs de parcelles de jardin doivent :
- Maintenir leur parcelle en bon état
- Suivre des pratiques de culture biologique
- Partager les excédents de production avec les voisins

Article 4 : Gouvernance
Un comité de jardinage composé de 5 résidents élus supervisera les opérations et résoudra les différends.`,
    publishedAt: "2024-11-25",
    status: "active",
    upvotes: 234,
    downvotes: 45,
    userVote: null,
  },
  {
    id: "law-2",
    title: "Politique des Heures de Silence",
    description:
      "Mettre en place des heures de silence de 22h à 7h dans les zones résidentielles pour garantir un cadre de vie paisible.",
    fullText: `Article 1 : Heures de Silence
Tous les résidents doivent observer les heures de silence entre 22h00 et 7h00 chaque jour.

Article 2 : Restrictions
Pendant les heures de silence, les activités suivantes sont interdites :
- Musique forte ou divertissements bruyants
- Travaux de construction
- Rassemblements extérieurs de plus de 5 personnes

Article 3 : Application
Les infractions peuvent entraîner des avertissements et des obligations de service communautaire.`,
    publishedAt: "2024-11-20",
    status: "passed",
    upvotes: 456,
    downvotes: 89,
    userVote: "up",
  },
  {
    id: "law-3",
    title: "Extension des Transports en Commun",
    description:
      "Étendre les lignes de bus pour couvrir les zones mal desservies de la grille pour une meilleure mobilité.",
    fullText: `Article 1 : Plan d'Extension
L'autorité des transports publics doit étendre le service aux secteurs 100-200 et 400-500 de la grille.

Article 2 : Calendrier
La mise en œuvre doit commencer dans les 60 jours suivant l'adoption et être achevée dans les 180 jours.

Article 3 : Financement
Financé par une taxe de 0,5% sur toutes les maisons placées.`,
    publishedAt: "2024-11-18",
    status: "pending",
    upvotes: 123,
    downvotes: 67,
    userVote: null,
  },
  {
    id: "law-4",
    title: "Obligation d'Énergie Renouvelable",
    description:
      "Exiger que toutes les nouvelles constructions incluent des panneaux solaires ou d'autres sources d'énergie renouvelable.",
    fullText: `Article 1 : Exigences
Toutes les nouvelles maisons placées après l'adoption doivent inclure des systèmes d'énergie renouvelable.

Article 2 : Incitations
Les maisons existantes qui se modernisent recevront des crédits d'impôt foncier.

Article 3 : Conformité
Les maisons doivent générer au moins 30% de leurs besoins énergétiques à partir de sources renouvelables.`,
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
          title: "Délai actif",
          description: "Vous devez attendre avant de pouvoir déplacer votre maison à nouveau.",
          variant: "destructive",
        });
        return;
      }

      const isOccupied = allHouses.some((h) => h.x === x && h.y === y);
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
      console.log("Proposition soumise:", { title, text });
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
