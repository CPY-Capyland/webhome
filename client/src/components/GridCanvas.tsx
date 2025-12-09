import { useState, useRef, useEffect, useCallback } from "react";
import { Home, ZoomIn, ZoomOut, RotateCcw, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const GRID_SIZE = 500;
const BASE_CELL_SIZE = 16;
const ZOOM_LEVELS = [0.25, 0.5, 1, 2, 4];

interface House {
  x: number;
  y: number;
  userId: string;
  isCurrentUser?: boolean;
}

interface GridCanvasProps {
  houses: House[];
  userHouse: House | null;
  canPlace: boolean;
  onCellClick: (x: number, y: number) => void;
}

export default function GridCanvas({
  houses,
  userHouse,
  canPlace,
  onCellClick,
}: GridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomIndex, setZoomIndex] = useState(2);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  const zoom = ZOOM_LEVELS[zoomIndex];
  const cellSize = BASE_CELL_SIZE * zoom;

  const housesMap = new Map(houses.map((h) => [`${h.x},${h.y}`, h]));

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
            ctx.fillStyle = isDark ? "hsl(210, 8%, 40%)" : "hsl(210, 8%, 50%)";
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
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawGrid();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [drawGrid]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

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
      setHoveredCell({ x: gridX, y: gridY });
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

  const handleZoomIn = () => {
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_LEVELS.length - 1));
  };

  const handleZoomOut = () => {
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoomIndex = zoomIndex - Math.sign(e.deltaY);
    if (newZoomIndex >= 0 && newZoomIndex < ZOOM_LEVELS.length) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const newZoom = ZOOM_LEVELS[newZoomIndex];
      const oldZoom = ZOOM_LEVELS[zoomIndex];

      const newOffsetX = mouseX - (mouseX - offset.x) * (newZoom / oldZoom);
      const newOffsetY = mouseY - (mouseY - offset.y) * (newZoom / oldZoom);
      
      setZoomIndex(newZoomIndex);
      setOffset({ x: newOffsetX, y: newOffsetY });
    }
  };

  const handleReset = () => {
    setZoomIndex(2);
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
      className="relative flex-1 bg-background overflow-hidden"
      data-testid="grid-container"
    >
      <canvas
        ref={canvasRef}
        className="cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          setHoveredCell(null);
        }}
        onClick={handleClick}
        onWheel={handleWheel}
        data-testid="grid-canvas"
      />

      {hoveredCell && (
        <div
          className="absolute top-4 left-4 bg-card border border-card-border px-3 py-1.5 rounded-md text-sm font-mono"
          data-testid="text-coordinates"
        >
          ({hoveredCell.x}, {hoveredCell.y})
        </div>
      )}

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              onClick={handleZoomIn}
              disabled={zoomIndex >= ZOOM_LEVELS.length - 1}
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
              disabled={zoomIndex <= 0}
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
