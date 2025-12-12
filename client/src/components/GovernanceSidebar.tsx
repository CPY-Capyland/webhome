import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileText, Users, Plus, Search } from "lucide-react";
import LawCard from "./LawCard";
import SuggestionForm from "./SuggestionForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LawWithVotes as Law, HouseWithUser } from "@shared/schema";

interface GovernanceSidebarProps {
  laws: Law[];
  canVote: boolean;
  totalHouses: number;
  onVote: (lawId: string, vote: "up" | "down" | null) => void;
  canSuggest?: boolean;
  onSuggestionSubmit?: (title: string, text: string) => void;
  isMobile?: boolean;
  setMobileView?: (view: "grid" | "laws" | "propose" | "feed") => void;
  userHouse: HouseWithUser | null;
  onChangeColor: (color: string) => void;
}

export default function GovernanceSidebar({
  laws,
  canVote,
  canSuggest,
  totalHouses,
  onVote,
  onSuggestionSubmit,
  isMobile,
  setMobileView,
  userHouse,
  onChangeColor,
}: GovernanceSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const activeLaws = laws.filter((l) => l.status === "active").length;
  const [color, setColor] = useState(userHouse?.color || "#FF0000");

  const filteredLaws = laws.filter((law) =>
    law.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`relative ${isMobile ? 'w-full' : 'w-80 border-l'} border-border bg-sidebar flex flex-col h-full`}>
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-serif font-semibold">Gouvernance</h2>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{activeLaws} lois actives</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{totalHouses} résidents</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une loi..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Lois publiées
            </h3>
            <div className="space-y-4">
              {filteredLaws.length > 0 ? (
                filteredLaws.map((law) => (
                  <LawCard
                    key={law.id}
                    law={law}
                    canVote={canVote}
                    onVote={onVote}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {laws.length > 0 ? "Aucune loi ne correspond à votre recherche." : "Aucune loi n'a encore été publiée."}
                </p>
              )}
            </div>
          </div>

          {!isMobile && onSuggestionSubmit && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Faites entendre votre voix
                </h3>
                <SuggestionForm
                  canSuggest={canSuggest ?? false}
                  onSuggestionSubmit={onSuggestionSubmit}
                />
              </div>
              <Separator />
              </div>
            </>
          )}
        </div>
      </ScrollArea>
      {isMobile && canSuggest && setMobileView && (
        <Button
          className="absolute bottom-20 right-4 rounded-full h-16 w-16 shadow-lg"
          onClick={() => setMobileView("propose")}
        >
          <Plus className="h-8 w-8" />
        </Button>
      )}
    </div>
  );
}

