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
        title: "Suggestion Submitted",
        description: "Your proposal has been sent to the government for review.",
      });
    } catch {
      toast({
        title: "Submission Failed",
        description: "Please try again later.",
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
            <span>Suggest a Law</span>
          </div>
          <span className="text-muted-foreground text-xs">
            {isOpen ? "Close" : "Expand"}
          </span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4 space-y-4">
        {!canSuggest ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            You need to place a house on the grid before you can submit
            suggestions to the government.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="suggestion-title">Title</Label>
              <Input
                id="suggestion-title"
                placeholder="Brief title for your proposal..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                data-testid="input-suggestion-title"
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestion-text">Proposal Details</Label>
              <Textarea
                id="suggestion-text"
                placeholder="Describe your proposal in detail. What problem does it solve? How should it be implemented?"
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
                  {charCount}/{MAX_CHARS} characters
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
              <span>{isSubmitting ? "Submitting..." : "Submit Proposal"}</span>
            </Button>
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
