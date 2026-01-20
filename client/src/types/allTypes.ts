// ============================================
// DRAWING TYPES
// ============================================

export interface Point {
  x: number;
  y: number;
  t: number;
}

export interface ToolConfig {
  color: string;
  width: number;
}

export interface DrawAction {
  type: "start" | "draw" | "end";
  toolType: string;
  point: Point;
  previousPoint?: Point | null;
  config: ToolConfig;
  userId?: string;
  actionId?: string | null;
  timestamp?: number;
}

// ============================================
// TOOL INTERFACE
// ============================================

export interface Tool {
  type: string;
  onStart: (point: Point) => void;
  onMove: (point: Point) => void;
  onEnd: () => void;
  onCancel?: () => void;
}

// ============================================
// SOCKET TYPES
// ============================================

export interface CursorData {
  userId: string;
  point: Point;
  timestamp: number;
}

export interface RemoteCursorState {
  point: Point;
  timestamp: number;
}

export interface CanvasState {
  actions: DrawAction[];
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface ToolBoxProps {
  toolType: string;
  setToolType: (tool: string) => void;
  color: string;
  setColor: (color: string) => void;
  width: number;
  setWidth: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export interface RemoteCursorsProps {
  remoteCursors: Map<string, RemoteCursorState>;
  activeUsers: UserData[];
}

// ============================================
// USER MANAGEMENT TYPES
// ============================================

export interface UserData {
  userId: string;
  color: string;
  joinedAt: number;
}

export interface UserJoinedPayload {
  userId: string;
  color: string;
  timestamp: number;
}

export interface UserLeftPayload {
  userId: string;
  timestamp: number;
}
