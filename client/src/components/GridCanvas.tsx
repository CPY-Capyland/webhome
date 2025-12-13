import { useState, useRef, useEffect, useCallback } from "react";
import { Home, ZoomIn, ZoomOut, RotateCcw, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useResizeObserver } from "@/hooks/use-resize-observer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";

const GRID_SIZE = 500;
const BASE_CELL_SIZE = 16;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

interface House {
  x: number;
  y: number;
  userId: string;
  isCurrentUser?: boolean;
  username: string;
  color: string;
}

interface GridCanvasProps {
  houses: House[];
  userHouse: House | null;
  canPlace: boolean;
  onCellClick: (x: number, y: number) => void;
  onMoveHouse: () => void;
  onAccessJobs: () => void;
  onChangeColor: (color: string) => void;
  onAccessJobs: () => void;
  onChangeColor: (color: string) => void;
  onDeleteHouse: () => void;
  selectedUserHouse: House | null;
}

export default function GridCanvas({
  houses,
  userHouse,
  canPlace,
  onCellClick,
  onMoveHouse,
  onAccessJobs,
  onChangeColor,
  onDeleteHouse,
  selectedUserHouse,
}: GridCanvasProps) {
  const { ref: containerRef, entry: containerEntry } = useResizeObserver<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; house?: House } | null>(null);
  const [isHouseMenuOpen, setIsHouseMenuOpen] = useState(false);
  const pinchStartDistanceRef = useRef<number | null>(null);

  const cellSize = BASE_CELL_SIZE * zoom;

  const housesMap = new Map(houses.map((h) => [`${h.x},${h.y}`, h]));

  useEffect(() => {
    if (selectedUserHouse && canvasRef.current) {
        const canvas = canvasRef.current;
        const targetX = selectedUserHouse.x;
        const targetY = selectedUserHouse.y;

        setOffset({
            x: canvas.width / 2 - targetX * cellSize,
            y: canvas.height / 2 - targetY * cellSize,
        });
        setZoom(1); // Reset zoom to 1 when centering
    }
  }, [selectedUserHouse, cellSize]);

  const getTouchPosition = (e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      const pos = getTouchPosition(e);
      setDragStart({ x: pos.x - offset.x, y: pos.y - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && pinchStartDistanceRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDistance = Math.sqrt(dx * dx + dy * dy);
      const scale = newDistance / pinchStartDistanceRef.current;

      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * scale));

      if (newZoom !== zoom) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();

        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

        const newOffsetX = midX - (midX - offset.x) * (newZoom / zoom);
        const newOffsetY = midY - (midY - offset.y) * (newZoom / zoom);

        setZoom(newZoom);
        setOffset({ x: newOffsetX, y: newOffsetY });
        pinchStartDistanceRef.current = newDistance;
      }

    } else if (e.touches.length === 1 && isDragging) {
      const pos = getTouchPosition(e);
      setOffset({
        x: pos.x - dragStart.x,
        y: pos.y - dragStart.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    pinchStartDistanceRef.current = null;
    setIsDragging(false);
  };

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    const startX = Math.floor(-offset.x / cellSize);
    const startY = Math.floor(-offset.y / cellSize);
    const endX = Math.ceil((width - offset.x) / cellSize);
    const endY = Math.ceil((height - offset.y) / cellSize);
    const isDark = document.documentElement.classList.contains("dark");
    for (let x = Math.max(0, startX); x < Math.min(GRID_SIZE, endX); x++) {
      for (let y = Math.max(0, startY); y < Math.min(GRID_SIZE, endY); y++) {
        const screenX = x * cellSize + offset.x;
        const screenY = y * cellSize + offset.y;
        const key = `${x},${y}`;
        const house = housesMap.get(key);
        ctx.strokeStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(screenX, screenY, cellSize, cellSize);
        if (house) {
          if (house.isCurrentUser) {
            ctx.fillStyle = isDark ? "hsl(217, 91%, 55%)" : "hsl(217, 91%, 45%)";
          } else {
            ctx.fillStyle = house.color;
          }
          ctx.beginPath();
          const cx = screenX + cellSize / 2;
          const cy = screenY + cellSize / 2;
          const size = cellSize * 0.6;
          ctx.moveTo(cx, cy - size / 2);
          ctx.lineTo(cx + size / 2, cy);
          ctx.lineTo(cx + size / 2, cy + size / 3);
          ctx.lineTo(cx - size / 2, cy + size / 3);
          ctx.lineTo(cx - size / 2, cy);
          ctx.closePath();
          ctx.fill();
        }
        if (
          hoveredCell &&
          hoveredCell.x === x &&
          hoveredCell.y === y &&
          !house &&
          canPlace
        ) {
          ctx.fillStyle = isDark
            ? "rgba(34, 197, 94, 0.3)"
            : "rgba(34, 197, 94, 0.2)";
          ctx.fillRect(screenX + 1, screenY + 1, cellSize - 2, cellSize - 2);
          ctx.strokeStyle = isDark
            ? "rgba(34, 197, 94, 0.8)"
            : "rgba(34, 197, 94, 0.6)";
          ctx.lineWidth = 2;
          ctx.strokeRect(screenX + 1, screenY + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
  }, [offset, cellSize, housesMap, hoveredCell, canPlace]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerEntry) return;

    canvas.width = containerEntry.contentRect.width;
    canvas.height = containerEntry.contentRect.height;
    drawGrid();
  }, [containerEntry, drawGrid]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const gridX = Math.floor((mouseX - offset.x) / cellSize);
    const gridY = Math.floor((mouseY - offset.y) / cellSize);

    if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
      const house = housesMap.get(`${gridX},${gridY}`);
      setHoveredCell({ x: gridX, y: gridY, house });
    } else {
      setHoveredCell(null);
    }

    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const gridX = Math.floor((mouseX - offset.x) / cellSize);
    const gridY = Math.floor((mouseY - offset.y) / cellSize);

    const house = housesMap.get(`${gridX},${gridY}`);
    if (house && house.isCurrentUser) {
      setIsHouseMenuOpen(true);
      return;
    }

    if (
      gridX >= 0 &&
      gridX < GRID_SIZE &&
      gridY >= 0 &&
      gridY < GRID_SIZE &&
      canPlace
    ) {
      const key = `${gridX},${gridY}`;
      if (!housesMap.has(key)) {
        onCellClick(gridX, gridY);
      }
    }
  };

  const handleZoom = useCallback((delta: number, mouseX: number, mouseY: number) => {
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * delta));
    if (newZoom !== zoom) {
      const newOffsetX = mouseX - (mouseX - offset.x) * (newZoom / zoom);
      const newOffsetY = mouseY - (mouseY - offset.y) * (newZoom / zoom);
      setZoom(newZoom);
      setOffset({ x: newOffsetX, y: newOffsetY });
    }
  }, [zoom, offset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 / 1.1 : 1.1;
      const rect = canvas.getBoundingClientRect();
      handleZoom(delta, e.clientX - rect.left, e.clientY - rect.top);
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleZoom]);

  const handleZoomIn = () => handleZoom(1.5, canvasRef.current!.width / 2, canvasRef.current!.height / 2);
  const handleZoomOut = () => handleZoom(1 / 1.5, canvasRef.current!.width / 2, canvasRef.current!.height / 2);

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const goToUserHouse = () => {
    if (userHouse && canvasRef.current) {
      const canvas = canvasRef.current;
      setOffset({
        x: canvas.width / 2 - userHouse.x * cellSize,
        y: canvas.height / 2 - userHouse.y * cellSize,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 bg-background overflow-hidden touch-none"
      data-testid="grid-container"
    >
      <canvas
        ref={canvasRef}
        className="cursor-grab active:cursor-grabbing w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          setHoveredCell(null);
        }}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="grid-canvas"
      />
      <Dialog open={isHouseMenuOpen} onOpenChange={setIsHouseMenuOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gérer ma maison</DialogTitle>
            <DialogDescription>
              Que souhaitez-vous faire ?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button variant="outline" onClick={() => { onMoveHouse(); setIsHouseMenuOpen(false); }}>Déménager</Button>
            <Button variant="outline" onClick={() => { onAccessJobs(); setIsHouseMenuOpen(false); }}>Métiers</Button>
            <Button variant="destructive" onClick={() => { onDeleteHouse(); setIsHouseMenuOpen(false); }}>Supprimer la maison</Button>
          </div>
          <div className="space-y-2 pt-4">
            <h4 className="font-medium leading-none">Changer la couleur</h4>
            <div className="flex flex-wrap gap-2">
              {['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'].map((color) => (
                <Button
                  key={color}
                  variant="outline"
                  className="w-8 h-8 p-0"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onChangeColor(color);
                    setIsHouseMenuOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {hoveredCell && (
        <div
          className="absolute top-4 left-4 bg-card border border-card-border px-3 py-1.5 rounded-md text-sm font-mono"
          data-testid="text-coordinates"
        >
          ({hoveredCell.x}, {hoveredCell.y})
          {hoveredCell.house && (
            <span className="ml-2 font-sans font-bold">
              {hoveredCell.house.username}
            </span>
          )}
        </div>
      )}

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              data-testid="button-zoom-in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoomer</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              data-testid="button-zoom-out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Dézoomer</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              onClick={handleReset}
              data-testid="button-reset-view"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Réinitialiser la vue</TooltipContent>
        </Tooltip>

        {userHouse && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="default"
                onClick={goToUserHouse}
                data-testid="button-go-to-house"
              >
                <Home className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Aller à ma maison</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="absolute bottom-4 left-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Move className="h-4 w-4" />
        <span>Glisser pour naviguer</span>
        <span className="mx-1">|</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
