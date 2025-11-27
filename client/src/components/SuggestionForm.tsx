import { useState } from "react";
import { Send, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

const MAX_CHARS = 2000;
const MIN_CHARS = 50;

interface SuggestionFormProps {
  canSuggest: boolean;
  onSubmit: (title: string, text: string) => void;
}

export default function SuggestionForm({
  canSuggest,
  onSubmit,
}: SuggestionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const charCount = text.length;
  const isValidLength = charCount >= MIN_CHARS && charCount <= MAX_CHARS;
  const isTitleValid = title.trim().length >= 5;
  const canSubmit = canSuggest && isValidLength && isTitleValid && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      onSubmit(title.trim(), text.trim());
      setTitle("");
      setText("");
      setIsOpen(false);
      toast({
        title: "Proposition soumise",
        description: "Votre proposition a été envoyée au gouvernement pour examen.",
      });
    } catch {
      toast({
        title: "Échec de la soumission",
        description: "Veuillez réessayer plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between gap-2"
          data-testid="button-toggle-suggestion"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span>Proposer une loi</span>
          </div>
          <span className="text-muted-foreground text-xs">
            {isOpen ? "Fermer" : "Ouvrir"}
          </span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4 space-y-4">
        {!canSuggest ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Vous devez placer une maison sur la grille avant de pouvoir
            soumettre des propositions au gouvernement.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="suggestion-title">Titre</Label>
              <Input
                id="suggestion-title"
                placeholder="Titre bref de votre proposition..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                data-testid="input-suggestion-title"
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/100 caractères
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestion-text">Détails de la proposition</Label>
              <Textarea
                id="suggestion-text"
                placeholder="Décrivez votre proposition en détail. Quel problème résout-elle ? Comment devrait-elle être mise en œuvre ?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-32 resize-none"
                maxLength={MAX_CHARS}
                data-testid="input-suggestion-text"
              />
              <div className="flex items-center justify-between text-xs">
                <span
                  className={
                    charCount < MIN_CHARS
                      ? "text-chart-4"
                      : charCount > MAX_CHARS
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }
                >
                  {charCount}/{MAX_CHARS} caractères
                  {charCount < MIN_CHARS && ` (min ${MIN_CHARS})`}
                </span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full gap-2"
              data-testid="button-submit-suggestion"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? "Envoi en cours..." : "Soumettre la proposition"}</span>
            </Button>
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
