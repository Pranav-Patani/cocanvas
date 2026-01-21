import { useEffect, useRef, useState, useCallback } from "react";
import {
  initContext,
  resizeCanvasToDisplaySize,
  getCanvasPoint,
} from "./canvasEngine";
import RemoteCursors from "../components/RemoteCursors";
import { createTool, TOOL_TYPES } from "./tools";
import socketClient from "../socket/socketClient";
import { PERFORMANCE_CONFIG } from "../config/performance";
import {
  DrawAction,
  Point,
  RemoteCursorState,
  Tool,
  UserData,
} from "../types/allTypes";
import SideBar from "../components/SideBar";
import Loading from "../components/Loading";

export default function CanvasBoard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const toolRef = useRef<Tool | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<Point | null>(null);
  const cursorTimeoutRef = useRef<number | null>(null);
  const lastCursorCallRef = useRef<number>(0);
  const cursorTimeouts = useRef<Map<string, number>>(new Map());

  const pendingDrawActions = useRef<DrawAction[]>([]);
  const lastBatchSent = useRef<number>(0);
  const batchTimeoutRef = useRef<number | null>(null);

  const [remoteCursors, setRemoteCursors] = useState<
    Map<string, RemoteCursorState>
  >(new Map());
  const [activeUsers, setActiveUsers] = useState<UserData[]>([]);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [toolType, setToolType] = useState<string>(TOOL_TYPES.BRUSH);
  const [color, setColor] = useState<string>("#000000");
  const [width, setWidth] = useState<number>(6);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoadingCanvas, setIsLoadingCanvas] = useState<boolean>(true);

  const applyRemoteAction = (action: DrawAction) => {
    if (!ctxRef.current) return;

    const ctx = ctxRef.current;
    ctx.save();
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
    ctx.restore();
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

  const throttledCursorMove = useCallback((point: Point) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCursorCallRef.current;
    const delay = PERFORMANCE_CONFIG.CURSOR_THROTTLE_MS;

    if (timeSinceLastCall >= delay) {
      lastCursorCallRef.current = now;
      socketClient.emitCursorMove(point);
    } else {
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
      cursorTimeoutRef.current = setTimeout(() => {
        lastCursorCallRef.current = Date.now();
        socketClient.emitCursorMove(point);
        cursorTimeoutRef.current = null;
      }, delay - timeSinceLastCall);
    }
  }, []);

  const batchDrawAction = useCallback((action: DrawAction) => {
    pendingDrawActions.current.push(action);

    const now = Date.now();
    const timeSinceBatch = now - lastBatchSent.current;
    const batchDelay =
      action.type === "draw" ? PERFORMANCE_CONFIG.BATCH_INTERVAL_MS : 0;

    const isMaxSize =
      pendingDrawActions.current.length >= PERFORMANCE_CONFIG.BATCH_MAX_SIZE;

    if (action.type === "start" || action.type === "end" || isMaxSize) {
      flushBatch();
    } else if (timeSinceBatch >= batchDelay) {
      flushBatch();
    } else if (!batchTimeoutRef.current) {
      batchTimeoutRef.current = setTimeout(
        flushBatch,
        batchDelay - timeSinceBatch,
      );
    }
  }, []);

  const flushBatch = useCallback(() => {
    if (pendingDrawActions.current.length === 0) return;

    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }

    const actions = [...pendingDrawActions.current];
    pendingDrawActions.current = [];
    lastBatchSent.current = Date.now();

    if (actions.length === 1) {
      socketClient.emitDrawAction(actions[0]);
    } else {
      socketClient.emitDrawActionBatch(actions);
    }
  }, []);

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

    const handleConnect = () => {
      console.log("Socket connected");
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    };

    socketClient.socket?.on("connect", handleConnect);
    socketClient.socket?.on("disconnect", handleDisconnect);

    socketClient.onDrawAction((action) => {
      if (action.userId === socketClient.userId) return;
      applyRemoteAction(action);
    });

    socketClient.onDrawActionBatch((batch) => {
      batch.actions.forEach((action) => {
        if (action.userId === socketClient.userId) return;
        applyRemoteAction(action);
      });
    });

    socketClient.onCanvasState((state) => {
      state.actions.forEach((action) => applyRemoteAction(action));
      setCanUndo(state.actions.length > 0);
      setCanRedo(false);
      setIsLoadingCanvas(false);
    });

    socketClient.onStateUpdate((state) => {
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
    });

    socketClient.onCursorMove((data) => {
      if (data.userId === socketClient.userId) return;

      const existingTimeout = cursorTimeouts.current.get(data.userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      setRemoteCursors((prev) => {
        const updated = new Map(prev);
        updated.set(data.userId, {
          point: data.point,
          timestamp: data.timestamp,
        });
        return updated;
      });

      const timeoutId = setTimeout(() => {
        setRemoteCursors((prev) => {
          const updated = new Map(prev);
          if (updated.get(data.userId)?.timestamp === data.timestamp) {
            updated.delete(data.userId);
          }
          return updated;
        });
        cursorTimeouts.current.delete(data.userId);
      }, PERFORMANCE_CONFIG.CURSOR_TIMEOUT_MS);
      cursorTimeouts.current.set(data.userId, timeoutId);
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

    socketClient.onResetDone((result) => {
      setCanUndo(result.canUndo);
      setCanRedo(result.canRedo);

      if (result.success && ctxRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    return () => {
      flushBatch();
      socketClient.socket?.off("connect", handleConnect);
      socketClient.socket?.off("disconnect", handleDisconnect);
      socketClient.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!ctxRef.current) return;
    toolRef.current?.onCancel?.();
    toolRef.current = createTool(toolType, ctxRef.current, { color, width });
  }, [toolType, color, width]);

  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      cursorTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      cursorTimeouts.current.clear();
    };
  }, []);

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
    throttledCursorMove(point);

    if (!isDrawingRef.current) return;

    toolRef.current.onMove(point);

    batchDrawAction({
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

    pendingDrawActions.current.push({
      type: "end",
      toolType,
      point,
      config: { color, width },
    });

    flushBatch();

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

  const handleReset = () => {
    if (
      window.confirm(
        "Are you sure you want to clear the canvas? This will affect all users.",
      )
    ) {
      socketClient.emitReset();
    }
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

  const isLoading = !isConnected || isLoadingCanvas;

  return (
    <div className="canvas-container">
      <Loading isLoading={isLoading} />

      <SideBar
        users={activeUsers}
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
        onReset={handleReset}
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

      <RemoteCursors remoteCursors={remoteCursors} activeUsers={activeUsers} />
    </div>
  );
}
