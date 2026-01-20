import { io, Socket } from "socket.io-client";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";
import {
  DrawAction,
  CursorData,
  CanvasState,
  Point,
  UserJoinedPayload,
  UserLeftPayload,
  UserData,
} from "../types/allTypes";

class SocketClient {
  socket: Socket | null;
  userId: string | null;
  userName: string | null;

  constructor() {
    this.socket = null;
    this.userId = null;
    this.userName = null;
  }

  connect(roomId: string = "default") {
    const serverUrl =
      window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : `http://${window.location.hostname}:8000`;

    this.socket = io(serverUrl, {
      query: { roomId },
    });
    this.userId = this.socket.id;
    this.userName = uniqueNamesGenerator({
      dictionaries: [adjectives, colors, animals],
      style: "capital",
      separator: " ",
      length: 2,
    });

    this.socket.on("connect", () => {
      this.userId = this.socket.id;
      console.log("Connected with ID:", this.userId, "Name:", this.userName);

      this.socket.emit("user-data", {
        id: this.userId,
        userName: this.userName,
      });
    });

    return this.socket;
  }

  emitDrawActionBatch(actions: DrawAction[]) {
    if (!this.socket || actions.length === 0) return;

    this.socket.emit("draw-action-batch", {
      actions: actions.map((action) => ({
        ...action,
        timestamp: action.timestamp || Date.now(),
      })),
      batchId: `${this.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }

  emitDrawAction(action: DrawAction) {
    if (!this.socket) return;

    this.socket.emit("draw-action", {
      ...action,
      timestamp: Date.now(),
    });
  }

  emitCursorMove(point: Point) {
    if (!this.socket) return;

    this.socket.emit("cursor-move", {
      point,
      timestamp: Date.now(),
    });
  }

  onDrawActionBatch(
    callback: (batch: { actions: DrawAction[]; batchId: string }) => void,
  ) {
    if (!this.socket) return;
    this.socket.on("draw-action-batch", callback);
  }

  onDrawAction(callback: (action: DrawAction) => void) {
    if (!this.socket) return;
    this.socket.on("draw-action", callback);
  }

  onCursorMove(callback: (data: CursorData) => void) {
    if (!this.socket) return;
    this.socket.on("cursor-move", callback);
  }

  onCanvasState(callback: (state: CanvasState) => void) {
    if (!this.socket) return;
    this.socket.on("canvas-state", callback);
  }

  onUserJoined(callback: (data: UserJoinedPayload) => void): void {
    if (!this.socket) return;
    this.socket.on("user-joined", callback);
  }

  onUserLeft(callback: (data: UserLeftPayload) => void): void {
    if (!this.socket) return;
    this.socket.on("user-left", callback);
  }

  onUsersUpdate(callback: (users: UserData[]) => void): void {
    if (!this.socket) return;
    this.socket.on("users-update", callback);
  }

  emitUndo() {
    if (!this.socket) return;
    this.socket.emit("undo");
  }

  emitRedo() {
    if (!this.socket) return;

    this.socket.emit("redo");
  }

  onUndoDone(callback: (result: any) => void) {
    if (!this.socket) return;
    this.socket.on("undo-done", callback);
  }

  onRedoDone(callback: (result: any) => void) {
    if (!this.socket) return;
    this.socket.on("redo-done", callback);
  }

  onStateUpdate(
    callback: (state: { canUndo: boolean; canRedo: boolean }) => void,
  ) {
    this.socket?.on("state-update", callback);
  }

  emitReset() {
    if (!this.socket) return;
    this.socket.emit("reset");
  }

  onResetDone(
    callback: (result: {
      success: boolean;
      canUndo: boolean;
      canRedo: boolean;
    }) => void,
  ) {
    if (!this.socket) return;
    this.socket.on("reset-done", callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new SocketClient();
