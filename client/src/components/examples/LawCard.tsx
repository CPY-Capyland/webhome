import LawCard, { type Law } from "../LawCard";

export default function LawCardExample() {
  // todo: remove mock functionality
  const mockLaw: Law = {
    id: "law-1",
    title: "Community Garden Initiative",
    description:
      "Proposal to establish community gardens in empty lots across the grid, promoting sustainable food production and community engagement.",
    fullText: `Section 1: Purpose
This law establishes a framework for creating and maintaining community gardens within designated areas of the grid.

Section 2: Eligibility
Any resident with a placed house may apply for a garden plot adjacent to their location.

Section 3: Responsibilities
Garden plot holders must:
- Maintain their plot in good condition
- Follow organic growing practices
- Share excess produce with neighbors

Section 4: Governance
A garden committee of 5 elected residents will oversee operations.`,
    publishedAt: "2024-11-25",
    status: "active",
    upvotes: 234,
    downvotes: 45,
    userVote: null,
  };

  return (
    <div className="max-w-md p-4">
      <LawCard
        law={mockLaw}
        canVote={true}
        onVote={(id, vote) => console.log(`Voted ${vote} on law ${id}`)}
      />
    </div>
  );
}
