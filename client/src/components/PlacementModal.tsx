import { useState } from "react";
import { Home, MapPin, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates: { x: number; y: number } | null;
  isMove: boolean;
  onConfirm: () => void;
}

export default function PlacementModal({
  isOpen,
  onClose,
  coordinates,
  isMove,
  onConfirm,
}: PlacementModalProps) {
  const [isPlacing, setIsPlacing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleConfirm = async () => {
    setIsPlacing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    onConfirm();
    setIsPlacing(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1500);
  };

  if (!coordinates) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="h-16 w-16 rounded-full bg-status-online/20 flex items-center justify-center">
              <Home className="h-8 w-8 text-status-online" />
            </div>
            <p className="text-lg font-semibold text-center">
              Maison {isMove ? "déplacée" : "placée"} avec succès !
            </p>
            <p className="text-sm text-muted-foreground">
              Emplacement : ({coordinates.x}, {coordinates.y})
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {isMove ? "Déplacer votre maison" : "Placer votre maison"}
              </DialogTitle>
              <DialogDescription>
                {isMove
                  ? "Vous êtes sur le point de déplacer votre maison vers un nouvel emplacement."
                  : "Vous êtes sur le point de placer votre maison sur la grille."}
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <div className="flex items-center justify-center gap-4">
                <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                  <Home className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-mono font-semibold">
                    ({coordinates.x}, {coordinates.y})
                  </p>
                  <p className="text-sm text-muted-foreground">Coordonnées de la grille</p>
                </div>
              </div>

              {isMove && (
                <div className="mt-6 p-3 rounded-md bg-chart-4/10 border border-chart-4/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-chart-4 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-chart-4">Délai de 24 heures</p>
                      <p className="text-muted-foreground">
                        Après le déménagement, vous devez attendre 24 heures avant de pouvoir déménager à nouveau.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="secondary"
                onClick={onClose}
                data-testid="button-cancel-placement"
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isPlacing}
                data-testid="button-confirm-placement"
              >
                {isPlacing
                  ? "Placement..."
                  : isMove
                    ? "Déplacer la maison"
                    : "Placer la maison"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
