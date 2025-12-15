import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (x: number, y: number) => void;
}

export default function MoveModal({ isOpen, onClose, onConfirm }: MoveModalProps) {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  const handleConfirm = () => {
    onConfirm(x, y);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Déménager</DialogTitle>
          <DialogDescription>
            Entrez les coordonnées de votre nouvelle maison.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            placeholder="X"
            value={x}
            onChange={(e) => setX(parseInt(e.target.value))}
          />
          <Input
            type="number"
            placeholder="Y"
            value={y}
            onChange={(e) => setY(parseInt(e.target.value))}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>Déménager</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}