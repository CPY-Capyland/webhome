import { useState } from "react";
import PlacementModal from "../PlacementModal";
import { Button } from "@/components/ui/button";

export default function PlacementModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4">
      <Button onClick={() => setIsOpen(true)} data-testid="button-open-modal">
        Open Placement Modal
      </Button>
      <PlacementModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        coordinates={{ x: 150, y: 275 }}
        isMove={false}
        onConfirm={() => console.log("House placed!")}
      />
    </div>
  );
}
