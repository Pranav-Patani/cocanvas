// src/canvas/tools/tools.js

import { drawDot, drawSegment } from "./canvasEngine.js";
import { Point, ToolConfig, Tool } from "../types/allTypes.js";

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

/*
  Tools are plain objects. They can keep their own internal state via closure variables (lastPoint, startPoint, etc.)
*/

export function createTool(
  toolType: string,
  ctx: CanvasRenderingContext2D,
  config: ToolConfig,
) {
  if (!ctx) throw new Error("ctx required");

  let lastPoint: Point | null = null;

  const eraserConfig: Tool = {
    type: TOOL_TYPES.ERASER,
    onStart(point: Point) {
      applyEraserStyle(ctx, config);
      lastPoint = point;
      drawDot(ctx, point);
    },
    onMove(point: Point) {
      if (!lastPoint) return;
      drawSegment(ctx, lastPoint, point);
      lastPoint = point;
    },
    onEnd() {
      lastPoint = null;
    },
    onCancel() {
      lastPoint = null;
    },
  };

  const brushConfig: Tool = {
    type: TOOL_TYPES.BRUSH,
    onStart(point: Point) {
      applyBrushStyle(ctx, config);
      lastPoint = point;
      drawDot(ctx, point);
    },
    onMove(point: Point) {
      if (!lastPoint) return;
      drawSegment(ctx, lastPoint, point);
      lastPoint = point;
    },
    onEnd() {
      lastPoint = null;
    },
    onCancel() {
      lastPoint = null;
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
