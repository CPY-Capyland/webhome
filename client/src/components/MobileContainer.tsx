import { useState } from "react";
import GridCanvas from "@/components/GridCanvas";
import GovernanceSidebar from "@/components/GovernanceSidebar";
import SuggestionForm from "@/components/SuggestionForm";
import { Button } from "@/components/ui/button";
import { Home, List, Bell } from "lucide-react";
import type { HouseWithUser, LawWithVotes, User } from "@shared/schema";

type MobileView = "grid" | "laws" | "propose" | "feed";

interface MobileContainerProps {
  user: User | null | undefined;
  houses: HouseWithUser[];
  userHouse: HouseWithUser | null;
  canPlace: boolean;
  onCellClick: (x: number, y: number) => void;
  laws: LawWithVotes[];
  hasHouse: boolean;
  canSuggest: boolean;
  onVote: (lawId: string, vote: "up" | "down" | null) => void;
  onSuggestionSubmit: (title: string, text: string) => void;
}

export default function MobileContainer({
  user,
  houses,
  userHouse,
  canPlace,
  onCellClick,
  laws,
  hasHouse,
  canSuggest,
  onVote,
  onSuggestionSubmit,
}: MobileContainerProps) {
  const [mobileView, setMobileView] = useState<MobileView>("grid");

  const renderContent = () => {
    switch (mobileView) {
      case "grid":
        return (
          <GridCanvas
            houses={houses}
            userHouse={userHouse}
            canPlace={canPlace}
            onCellClick={onCellClick}
          />
        );
      case "laws":
        return (
          <GovernanceSidebar
            laws={laws}
            canVote={hasHouse}
            canSuggest={canSuggest}
            totalHouses={houses.length}
            onVote={onVote}
            isMobile
            setMobileView={setMobileView}
          />
        );
      case "propose":
        return (
          <div className="p-4 h-full overflow-y-auto">
            <SuggestionForm
              canSuggest={hasHouse}
              onSuggestionSubmit={(title, text) => {
                onSuggestionSubmit(title, text);
                setMobileView("laws");
              }}
            />
          </div>
        );
      case "feed":
        return <div className="p-4">Nouveautés à venir...</div>;
      default:
        return null;
    }
  };
  
  const NavButton = ({ view, current, children, disabled }: { view: MobileView, current: MobileView, children: React.ReactNode, disabled?: boolean }) => (
    <Button
      variant={view === current ? "secondary" : "ghost"}
      onClick={() => setMobileView(view)}
      className="flex-col h-16 flex-1"
      disabled={disabled}
    >
      {children}
    </Button>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
      <div className="flex justify-around p-2 border-t bg-background">
        <NavButton view="grid" current={mobileView}>
          <Home />
          <span>Accueil</span>
        </NavButton>
        <NavButton view="laws" current={mobileView}>
          <List />
          <span>Lois</span>
        </NavButton>
        <NavButton view="feed" current={mobileView} disabled>
          <Bell />
          <span>Nouveautés</span>
        </NavButton>
      </div>
    </div>
  );
}
