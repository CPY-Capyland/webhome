import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface HouseMenuProps {
  children: React.ReactNode;
  onMove: () => void;
  onJobs: () => void;
  onChangeColor: () => void;
  onDelete: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: { x: number; y: number };
}

export default function HouseMenu({
  children,
  onMove,
  onJobs,
  onChangeColor,
  onDelete,
  open,
  onOpenChange,
  position,
}: HouseMenuProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        style={{
          position: "absolute",
          left: position.x,
          top: position.y,
        }}
      >
        <ContextMenuItem onClick={onMove}>Déménager</ContextMenuItem>
        <ContextMenuItem onClick={onJobs}>Métiers</ContextMenuItem>
        <ContextMenuItem onClick={onChangeColor}>Changer la couleur</ContextMenuItem>
        <ContextMenuItem onClick={onDelete}>Supprimer la maison</ContextMenuItem>
      </PopoverContent>
    </Popover>
  );
}
