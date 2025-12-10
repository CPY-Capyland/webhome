import { useState, useMemo, useEffect } from "react";
import { ThumbsUp, ThumbsDown, FileText, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { type LawWithVotes as Law } from "@shared/schema";

interface LawCardProps {
  law: Law;
  canVote: boolean;
  canUserVote?: boolean;
  onVote: (lawId: string, vote: "up" | "down" | null) => void;
}

const VOTING_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours
const VOTE_CHANGE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const getVotingStatus = (law: Law, canVote: boolean) => {
  const now = new Date();
  const publishedAt = new Date(law.publishedAt);
  const votingStart = new Date(publishedAt.getTime() + VOTING_DELAY_MS);
  const votingEndsAt = law.votingEndsAt ? new Date(law.votingEndsAt) : null;
  const userVotedAt = law.userVotedAt ? new Date(law.userVotedAt) : null;

  let statusText: string;
  let statusColorClass: string;
  let canChangeVote = false;
  let timeLeftToChangeVote: number | null = null;

  if (law.status === "passed") {
    statusText = "Adoptée";
    statusColorClass = "bg-green-500 text-white";
  } else if (law.status === "rejected") {
    statusText = "Rejetée";
    statusColorClass = "bg-red-500 text-white";
  } else if (law.isInTiebreak) {
    statusText = "Égalité";
    statusColorClass = "bg-yellow-500 text-white";
  } else if (now < votingStart) {
    statusText = "Proposition";
    statusColorClass = "bg-orange-500 text-white";
  } else if (votingEndsAt && now < votingEndsAt) {
    if (law.userVote && userVotedAt) {
      const voteChangeEnd = new Date(userVotedAt.getTime() + VOTE_CHANGE_WINDOW_MS);
      if (now < voteChangeEnd) {
        statusText = "Vote modifiable";
        statusColorClass = "bg-yellow-400 text-black";
        canChangeVote = true;
        timeLeftToChangeVote = voteChangeEnd.getTime() - now.getTime();
      } else {
        statusText = "A voté";
        statusColorClass = "bg-green-600 text-white";
      }
    } else {
      statusText = "Vote ouvert";
      statusColorClass = "bg-blue-500 text-white";
    }
  } else {
    statusText = "Terminée";
    statusColorClass = "bg-gray-500 text-white";
  }

  return { statusText, statusColorClass, canChangeVote, timeLeftToChangeVote };
};

export default function LawCard({ law, canVote, canUserVote = true, onVote }: LawCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentVote, setCurrentVote] = useState<"up" | "down" | null>(
    law.userVote || null
  );
  const [localUserVotedAt, setLocalUserVotedAt] = useState<Date | undefined>(law.userVotedAt);

  const totalVoters = law.upvotes + law.downvotes;
  const isVotable = canVote && canUserVote && (law.isVotable !== false);
  const { statusText, statusColorClass, canChangeVote, timeLeftToChangeVote } = useMemo(
    () => getVotingStatus(law, isVotable),
    [law, isVotable, currentVote, localUserVotedAt]
  );

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (timeLeftToChangeVote !== null && timeLeftToChangeVote > 0) {
      timer = setTimeout(() => {
        setLocalUserVotedAt(undefined); // Force re-evaluation of status
      }, timeLeftToChangeVote);
    }
    return () => clearTimeout(timer);
  }, [timeLeftToChangeVote]);

  const handleVote = (vote: "up" | "down") => {
    if (!isVotable && !canChangeVote) return;

    let newVote: "up" | "down" | null = currentVote === vote ? null : vote;
    
    setCurrentVote(newVote);
    setLocalUserVotedAt(new Date()); // Update local voted at timestamp
    onVote(law.id, newVote);
  };

  const publishedDate = new Date(law.publishedAt).toLocaleDateString('fr-FR');
  const votingEndsDate = law.votingEndsAt ? new Date(law.votingEndsAt).toLocaleDateString('fr-FR') : 'N/A';

  return (
    <Card className="hover-elevate" data-testid={`card-law-${law.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight flex-1">
            {law.title}
          </CardTitle>
          <div className="flex gap-1 flex-wrap justify-end">
            <Badge className={`text-[10px] px-1.5 py-0 ${statusColorClass}`}>
              {statusText}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Publiée le {publishedDate}</span>
          {law.status === "active" && votingEndsAt && (
            <span className="ml-2">
              • Vote se termine le {votingEndsDate}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {law.description}
        </p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={currentVote === "up" ? "default" : "secondary"}
              onClick={() => handleVote("up")}
              disabled={!isVotable && !canChangeVote}
              className="gap-1"
              data-testid={`button-upvote-${law.id}`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>{law.upvotes}</span>
            </Button>

            <Button
              size="sm"
              variant={currentVote === "down" ? "destructive" : "secondary"}
              onClick={() => handleVote("down")}
              disabled={!isVotable && !canChangeVote}
              className="gap-1"
              data-testid={`button-downvote-${law.id}`}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              <span>{law.downvotes}</span>
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Total votants: {totalVoters}
          </div>

          <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1"
                data-testid={`button-expand-${law.id}`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Lire tout</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <DialogTitle className="text-xl font-serif">
                    {law.title}
                  </DialogTitle>
                  <Badge className={`text-[10px] px-1.5 py-0 ${statusColorClass}`}>
                    {statusText}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Publié le{" "}
                    {publishedDate}
                  </span>
                </div>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{law.fullText}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-4">
                    <Button
                      variant={currentVote === "up" ? "default" : "secondary"}
                      onClick={() => handleVote("up")}
                      disabled={!isVotable && !canChangeVote}
                      className="gap-2"
                      data-testid={`button-modal-upvote-${law.id}`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>Pour ({law.upvotes})</span>
                    </Button>

                    <Button
                      variant={
                        currentVote === "down" ? "destructive" : "secondary"
                      }
                      onClick={() => handleVote("down")}
                      disabled={!isVotable && !canChangeVote}
                      className="gap-2"
                      data-testid={`button-modal-downvote-${law.id}`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      <span>Contre ({law.downvotes})</span>
                    </Button>
                  </div>

                  {(!isVotable && !canChangeVote) && (
                    <p className="text-sm text-muted-foreground">
                      {!canVote ? "Placez une maison pour voter" : "Vote fermé"}
                    </p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {timeLeftToChangeVote !== null && timeLeftToChangeVote > 0 && (
          <p className="text-xs text-center text-yellow-600">
            Vous avez {Math.ceil(timeLeftToChangeVote / 1000)} secondes pour changer votre vote.
          </p>
        )}
        {(!isVotable && !canChangeVote) && (
          <p className="text-xs text-muted-foreground text-center">
            {!canVote ? "Placez une maison sur la grille pour voter" : "Le vote n'est plus disponible"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
