import { useEffect, useRef, useState } from "react";
import {
  initContext,
  resizeCanvasToDisplaySize,
  getCanvasPoint,
} from "./canvasEngine.js";
import ToolBox from "../components/ToolBox.jsx";
import { createTool, TOOL_TYPES } from "./tools.js";
import socketClient from "../socket/socketClient.js";

export default function CanvasBoard() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const toolRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);

  const [toolType, setToolType] = useState(TOOL_TYPES.BRUSH);
  const [color, setColor] = useState("#000");
  const [width, setWidth] = useState(6);

  const applyRemoteAction = (action) => {
    if (!ctxRef.current) return;

    const ctx = ctxRef.current;
    const remoteTool = createTool(action.toolType, ctx, action.config);

    switch (action.type) {
      case "start":
        remoteTool.onStart(action.point);
        break;
      case "draw":
        if (action.previousPoint) {
          remoteTool.onStart(action.previousPoint);
          remoteTool.onMove(action.point);
        }
        break;
      case "end":
        remoteTool.onEnd(action.point);
        break;
    }
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;

    const resize = () => {
      resizeCanvasToDisplaySize(canvas, ctx);
      initContext(ctx);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Setup socket connections
  useEffect(() => {
    socketClient.connect();

    socketClient.onDrawAction((action) => {
      if (action.userId === socketClient.userId) return; // Ignore own actions

      applyRemoteAction(action);
    });

    socketClient.onCanvasState((state) => {
      state.actions.forEach((action) => applyRemoteAction(action));
    });

    return () => {
      socketClient.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!ctxRef.current) return;
    toolRef.current?.onCancel?.();
    toolRef.current = createTool(toolType, ctxRef.current, { color, width });
  }, [toolType, color, width]);

  const handlePointerDown = (e) => {
    if (!toolRef.current) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const point = getCanvasPoint(e, canvasRef.current);
    isDrawingRef.current = true;
    lastPointRef.current = point;

    toolRef.current.onStart(point);

    socketClient.emitDrawAction({
      type: "start",
      toolType,
      point,
      config: { color, width },
    });
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current || !toolRef.current) return;

    const point = getCanvasPoint(e, canvasRef.current);
    toolRef.current.onMove(point);

    socketClient.emitDrawAction({
      type: "draw",
      toolType,
      point,
      previousPoint: lastPointRef.current,
      config: { color, width },
    });

    lastPointRef.current = point;
  };

  const handlePointerUp = (e) => {
    if (!toolRef.current) return;

    const point = getCanvasPoint(e, canvasRef.current);
    toolRef.current.onEnd(point);
    isDrawingRef.current = false;

    socketClient.emitDrawAction({
      type: "end",
      toolType,
      point,
      config: { color, width },
    });

    lastPointRef.current = null;
  };

  const getCursorStyle = () => {
    switch (toolType) {
      case TOOL_TYPES.BRUSH:
        return "crosshair";
      case TOOL_TYPES.ERASER:
        return "cell";
      default:
        return "default";
    }
  };

  return (
    <div className="canvas-container">
      <ToolBox
        toolType={toolType}
        setToolType={setToolType}
        color={color}
        setColor={setColor}
        width={width}
        setWidth={setWidth}
      />

      <canvas
        ref={canvasRef}
        className="canvas-board"
        style={{ cursor: getCursorStyle() }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
