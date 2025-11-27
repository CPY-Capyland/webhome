import { useState } from "react";
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

export interface Law {
  id: string;
  title: string;
  description: string;
  fullText: string;
  publishedAt: string;
  status: "active" | "pending" | "passed" | "rejected";
  upvotes: number;
  downvotes: number;
  userVote?: "up" | "down" | null;
  isVotable?: boolean;
  votingEndsAt?: string;
  isInTiebreak?: boolean;
}

interface LawCardProps {
  law: Law;
  canVote: boolean;
  canUserVote?: boolean;
  onVote: (lawId: string, vote: "up" | "down" | null) => void;
}

const statusLabels = {
  active: "actif",
  pending: "en attente",
  passed: "adopté",
  rejected: "rejeté",
};

export default function LawCard({ law, canVote, canUserVote = true, onVote }: LawCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentVote, setCurrentVote] = useState<"up" | "down" | null>(
    law.userVote || null
  );
  const [votes, setVotes] = useState({
    up: law.upvotes,
    down: law.downvotes,
  });

  const isVotable = canVote && canUserVote && (law.isVotable !== false);

  const handleVote = (vote: "up" | "down") => {
    if (!isVotable) return;

    let newVote: "up" | "down" | null;
    const newVotes = { ...votes };

    if (currentVote === vote) {
      newVote = null;
      if (vote === "up") newVotes.up--;
      else newVotes.down--;
    } else {
      newVote = vote;
      if (currentVote === "up") newVotes.up--;
      if (currentVote === "down") newVotes.down--;
      if (vote === "up") newVotes.up++;
      else newVotes.down++;
    }

    setCurrentVote(newVote);
    setVotes(newVotes);
    onVote(law.id, newVote);
  };

  const statusColors = {
    active: "bg-primary text-primary-foreground",
    pending: "bg-chart-4 text-white",
    passed: "bg-status-online text-white",
    rejected: "bg-destructive text-destructive-foreground",
  };

  return (
    <Card className="hover-elevate" data-testid={`card-law-${law.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight flex-1">
            {law.title}
          </CardTitle>
          <div className="flex gap-1 flex-wrap justify-end">
            <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[law.status]}`}>
              {statusLabels[law.status]}
            </Badge>
            {!isVotable && law.status === "active" && (
              <Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground">
                {law.isInTiebreak ? "Égalité" : "Vote fermé"}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{new Date(law.publishedAt).toLocaleDateString('fr-FR')}</span>
          {law.votingEndsAt && isVotable && (
            <span className="ml-2">
              • Vote jusqu'au {new Date(law.votingEndsAt).toLocaleDateString('fr-FR')}
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
              disabled={!isVotable}
              className="gap-1"
              data-testid={`button-upvote-${law.id}`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>{votes.up}</span>
            </Button>

            <Button
              size="sm"
              variant={currentVote === "down" ? "destructive" : "secondary"}
              onClick={() => handleVote("down")}
              disabled={!isVotable}
              className="gap-1"
              data-testid={`button-downvote-${law.id}`}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              <span>{votes.down}</span>
            </Button>
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
                  <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[law.status]}`}>
                    {statusLabels[law.status]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Publié le{" "}
                    {new Date(law.publishedAt).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
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
                      disabled={!isVotable}
                      className="gap-2"
                      data-testid={`button-modal-upvote-${law.id}`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>Pour ({votes.up})</span>
                    </Button>

                    <Button
                      variant={
                        currentVote === "down" ? "destructive" : "secondary"
                      }
                      onClick={() => handleVote("down")}
                      disabled={!isVotable}
                      className="gap-2"
                      data-testid={`button-modal-downvote-${law.id}`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      <span>Contre ({votes.down})</span>
                    </Button>
                  </div>

                  {!isVotable && (
                    <p className="text-sm text-muted-foreground">
                      {!canVote ? "Placez une maison pour voter" : "Vote fermé"}
                    </p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {!isVotable && (
          <p className="text-xs text-muted-foreground text-center">
            {!canVote ? "Placez une maison sur la grille pour voter" : "Le vote n'est plus disponible"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
