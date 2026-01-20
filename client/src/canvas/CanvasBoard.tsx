import { useEffect, useRef, useState } from "react";
import {
  initContext,
  resizeCanvasToDisplaySize,
  getCanvasPoint,
} from "./canvasEngine.js";
import ToolBox from "../components/ToolBox.js";
import RemoteCursors from "../components/RemoteCursors.js";
import { createTool, TOOL_TYPES } from "./tools.js";
import socketClient from "../socket/socketClient.js";
import {
  DrawAction,
  Point,
  RemoteCursorState,
  Tool,
  UserData,
} from "../types/allTypes.js";
import ActiveUsers from "../components/ActiveUsers.js";

export default function CanvasBoard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const toolRef = useRef<Tool | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<Point | null>(null);

  const [remoteCursors, setRemoteCursors] = useState<
    Map<string, RemoteCursorState>
  >(new Map());
  const [activeUsers, setActiveUsers] = useState<UserData[]>([]);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [toolType, setToolType] = useState<string>(TOOL_TYPES.BRUSH);
  const [color, setColor] = useState<string>("#000000");
  const [width, setWidth] = useState<number>(6);

  const applyRemoteAction = (action: DrawAction) => {
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
        remoteTool.onEnd();
        break;
    }
  };

  const replayActions = (actions: DrawAction[]) => {
    if (!ctxRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    actions.forEach((action) => {
      applyRemoteAction(action);
    });
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
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
      if (action.userId === socketClient.userId) return;
      applyRemoteAction(action);
    });

    socketClient.onCanvasState((state) => {
      state.actions.forEach((action) => applyRemoteAction(action));
      setCanUndo(state.actions.length > 0);
      setCanRedo(false);
    });

    socketClient.onStateUpdate((state) => {
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
    });

    socketClient.onCursorMove((data) => {
      if (data.userId === socketClient.userId) return;
      setRemoteCursors((prev) => {
        const updated = new Map(prev);
        updated.set(data.userId, {
          point: data.point,
          timestamp: data.timestamp,
        });
        return updated;
      });

      setTimeout(() => {
        setRemoteCursors((prev) => {
          const updated = new Map(prev);
          if (updated.get(data.userId)?.timestamp === data.timestamp) {
            updated.delete(data.userId);
          }
          return updated;
        });
      }, 2000);
    });

    socketClient.onUserJoined((data) => {
      console.log("User joined:", data);
    });

    socketClient.onUserLeft((data) => {
      console.log("User left:", data);

      setRemoteCursors((prev) => {
        const updated = new Map(prev);
        updated.delete(data.userId);
        return updated;
      });
    });

    socketClient.onUsersUpdate((users) => {
      setActiveUsers(users);
    });

    socketClient.onUndoDone((result) => {
      setCanUndo(result.canUndo);
      setCanRedo(result.canRedo);

      if (result.success) {
        replayActions(result.actions);
      }
    });

    socketClient.onRedoDone((result) => {
      setCanUndo(result.canUndo);
      setCanRedo(result.canRedo);

      if (result.success) {
        replayActions(result.actions);
      }
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

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!toolRef.current || !canvasRef.current) return;

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
      actionId: null,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!toolRef.current || !canvasRef.current) return;

    const point = getCanvasPoint(e, canvasRef.current);

    socketClient.emitCursorMove(point);
    if (!isDrawingRef.current) return;

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

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!toolRef.current || !canvasRef.current) return;

    const point = getCanvasPoint(e, canvasRef.current);
    toolRef.current.onEnd();
    isDrawingRef.current = false;

    socketClient.emitDrawAction({
      type: "end",
      toolType,
      point,
      config: { color, width },
    });

    lastPointRef.current = null;
    setCanRedo(false);
    setCanUndo(true);
  };

  const handleUndo = () => {
    socketClient.emitUndo();
  };

  const handleRedo = () => {
    socketClient.emitRedo();
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
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
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

      <ActiveUsers users={activeUsers} />

      <RemoteCursors remoteCursors={remoteCursors} activeUsers={activeUsers} />
    </div>
  );
}
