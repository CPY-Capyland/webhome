import SuggestionForm from "../SuggestionForm";
import { Toaster } from "@/components/ui/toaster";

export default function SuggestionFormExample() {
  return (
    <div className="max-w-md p-4">
      <SuggestionForm
        canSuggest={true}
        onSubmit={(title, text) =>
          console.log("Submitted suggestion:", { title, text })
        }
      />
      <Toaster />
    </div>
  );
}
