// src/canvas/tools/tools.js

import { drawDot, drawSegment } from "./canvasEngine.js";

export const TOOL_TYPES = {
  BRUSH: "brush",
  ERASER: "eraser",
};

function applyBrushStyle(ctx, { color, width }) {
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
}

function applyEraserStyle(ctx, { width }) {
  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = "rgba(0,0,0,1)";
  ctx.lineWidth = width;
}

/*
  Tools are plain objects. They can keep their own internal state via closure variables (lastPoint, startPoint, etc.)
*/

export function createTool(toolType, ctx, config) {
  if (!ctx) throw new Error("ctx required");

  let lastPoint = null;

  const eraserConfig = {
    type: TOOL_TYPES.ERASER,
    onStart(point) {
      applyEraserStyle(ctx, config);
      lastPoint = point;
      drawDot(ctx, point);
    },
    onMove(point) {
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

  const brushConfig = {
    type: TOOL_TYPES.BRUSH,
    onStart(point) {
      applyBrushStyle(ctx, config);
      lastPoint = point;
      drawDot(ctx, point);
    },
    onMove(point) {
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
