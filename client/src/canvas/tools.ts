import { drawDot, drawBatchedSegments } from "./canvasEngine";
import { Point, ToolConfig, Tool } from "../types/allTypes";

export const TOOL_TYPES = {
  BRUSH: "brush",
  ERASER: "eraser",
};

function applyBrushStyle(
  ctx: CanvasRenderingContext2D,
  { color, width }: ToolConfig,
) {
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
}

function applyEraserStyle(
  ctx: CanvasRenderingContext2D,
  { width }: ToolConfig,
) {
  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = "rgba(0,0,0,1)";
  ctx.lineWidth = width;
}

function drawSegment(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}

export function createTool(
  toolType: string,
  ctx: CanvasRenderingContext2D,
  config: ToolConfig,
) {
  if (!ctx) throw new Error("ctx required");

  let lastPoint: Point | null = null;
  let strokePoints: Point[] = [];

  const eraserConfig: Tool = {
    type: TOOL_TYPES.ERASER,
    onStart(point: Point) {
      applyEraserStyle(ctx, config);
      lastPoint = point;
      strokePoints = [point];
      drawDot(ctx, point);
    },
    onMove(point: Point) {
      if (!lastPoint) return;

      drawSegment(ctx, lastPoint, point);

      strokePoints.push(point);
      lastPoint = point;
    },
    onEnd() {
      lastPoint = null;
      strokePoints = [];
    },
    onCancel() {
      lastPoint = null;
      strokePoints = [];
    },

    replayStroke(points: Point[]) {
      if (points.length === 0) return;
      applyEraserStyle(ctx, config);

      if (points.length === 1) {
        drawDot(ctx, points[0]);
      } else {
        drawBatchedSegments(ctx, points);
      }
    },
  };

  const brushConfig: Tool = {
    type: TOOL_TYPES.BRUSH,
    onStart(point: Point) {
      applyBrushStyle(ctx, config);
      lastPoint = point;
      strokePoints = [point];
      drawDot(ctx, point);
    },
    onMove(point: Point) {
      if (!lastPoint) return;

      drawSegment(ctx, lastPoint, point);

      strokePoints.push(point);
      lastPoint = point;
    },
    onEnd() {
      lastPoint = null;
      strokePoints = [];
    },
    onCancel() {
      lastPoint = null;
      strokePoints = [];
    },

    replayStroke(points: Point[]) {
      if (points.length === 0) return;
      applyBrushStyle(ctx, config);

      if (points.length === 1) {
        drawDot(ctx, points[0]);
      } else {
        drawBatchedSegments(ctx, points);
      }
    },
  };

  switch (toolType) {
    case TOOL_TYPES.ERASER: {
      return eraserConfig;
    }

    case TOOL_TYPES.BRUSH:
    default: {
      return brushConfig;
    }
  }
}
