import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Home, List, Plus, Bell } from "lucide-react";

type MobileMenuProps = {
  onNavigate: (view: "grid" | "laws" | "propose" | "feed") => void;
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentView: "grid" | "laws" | "propose" | "feed";
};

export default function MobileMenu({ onNavigate, children, isOpen, onOpenChange, currentView }: MobileMenuProps) {
  const handleNavigate = (view: "grid" | "laws" | "propose" | "feed") => {
    onNavigate(view);
  };

  const NavButton = ({ view, current, children, disabled }: { view: "grid" | "laws" | "propose" | "feed", current: "grid" | "laws" | "propose" | "feed", children: React.ReactNode, disabled?: boolean }) => (
    <Button
      variant={view === current ? "secondary" : "ghost"}
      onClick={() => handleNavigate(view)}
      className="flex-col h-16"
      disabled={disabled}
    >
      {children}
    </Button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full h-full flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
        <SheetFooter className="grid grid-cols-4 gap-2 p-2 border-t">
          <NavButton view="grid" current={currentView}>
            <Home />
            <span>Accueil</span>
          </NavButton>
          <NavButton view="laws" current={currentView}>
            <List />
            <span>Lois</span>
          </NavButton>
          <NavButton view="propose" current={currentView}>
            <Plus />
            <span>Proposer</span>
          </NavButton>
          <NavButton view="feed" current={currentView} disabled>
            <Bell />
            <span>Nouveautés</span>
          </NavButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
