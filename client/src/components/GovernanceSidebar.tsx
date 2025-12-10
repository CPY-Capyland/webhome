import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileText, Users } from "lucide-react";
import LawCard, { type Law } from "./LawCard";
import SuggestionForm from "./SuggestionForm";

interface GovernanceSidebarProps {
  laws: Law[];
  canVote: boolean;
  totalHouses: number;
  onVote: (lawId: string, vote: "up" | "down" | null) => void;
  canSuggest?: boolean;
  onSuggestionSubmit?: (title: string, text: string) => void;
  isMobile?: boolean;
}

export default function GovernanceSidebar({
  laws,
  canVote,
  canSuggest,
  totalHouses,
  onVote,
  onSuggestionSubmit,
  isMobile,
}: GovernanceSidebarProps) {
  const activeLaws = laws.filter((l) => l.status === "active").length;

  return (
    <div className={`${isMobile ? 'w-full' : 'w-80 border-l'} border-border bg-sidebar flex flex-col h-full`}>
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

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Lois publiées
            </h3>
            <div className="space-y-4">
              {laws.length > 0 ? (
                laws.map((law) => (
                  <LawCard
                    key={law.id}
                    law={law}
                    canVote={canVote}
                    onVote={onVote}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucune loi n'a encore été publiée.
                </p>
              )}
            </div>
          </div>

          {onSuggestionSubmit && (
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
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

