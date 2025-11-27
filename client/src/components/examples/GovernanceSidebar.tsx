import GovernanceSidebar from "../GovernanceSidebar";
import { type Law } from "../LawCard";
import { Toaster } from "@/components/ui/toaster";

export default function GovernanceSidebarExample() {
  // todo: remove mock functionality
  const mockLaws: Law[] = [
    {
      id: "law-1",
      title: "Community Garden Initiative",
      description:
        "Establish community gardens in empty lots for sustainable food production.",
      fullText: "Full text of the community garden law...",
      publishedAt: "2024-11-25",
      status: "active",
      upvotes: 234,
      downvotes: 45,
      userVote: null,
    },
    {
      id: "law-2",
      title: "Quiet Hours Policy",
      description:
        "Implement quiet hours from 10 PM to 7 AM in residential areas.",
      fullText: "Full text of the quiet hours policy...",
      publishedAt: "2024-11-20",
      status: "passed",
      upvotes: 456,
      downvotes: 89,
      userVote: "up",
    },
    {
      id: "law-3",
      title: "Public Transit Expansion",
      description: "Expand bus routes to cover more areas of the grid.",
      fullText: "Full text of the transit expansion...",
      publishedAt: "2024-11-18",
      status: "pending",
      upvotes: 123,
      downvotes: 67,
      userVote: null,
    },
  ];

  return (
    <div className="h-[600px] flex">
      <GovernanceSidebar
        laws={mockLaws}
        canVote={true}
        canSuggest={true}
        totalHouses={1247}
        onVote={(id, vote) => console.log(`Voted ${vote} on law ${id}`)}
        onSuggestionSubmit={(title, text) =>
          console.log("Suggestion submitted:", { title, text })
        }
      />
      <Toaster />
    </div>
  );
}
