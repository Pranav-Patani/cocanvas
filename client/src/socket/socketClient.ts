import { io, Socket } from "socket.io-client";
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
  userId: string;

  constructor() {
    this.socket = null;
    this.userId = this.generateUserId();
  }

  generateUserId() {
    return `user_${Math.random().toString(36).substr(2, 9)}`;
  }

  connect(roomId: string = "default") {
    this.socket = io("http://localhost:8000", {
      query: { roomId, userId: this.userId },
    });

    this.socket.on("connect", () => {
      console.log("Connected to server");
    });

    return this.socket;
  }

  emitDrawAction(action: DrawAction) {
    if (!this.socket) return;

    this.socket.emit("draw-action", {
      ...action,
      userId: this.userId,
      timestamp: Date.now(),
    });
  }

  emitCursorMove(point: Point) {
    if (!this.socket) return;

    this.socket.emit("cursor-move", {
      userId: this.userId,
      point,
      timestamp: Date.now(),
    });
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

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new SocketClient();
