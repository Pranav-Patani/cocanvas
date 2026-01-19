import { io } from "socket.io-client";

class SocketClient {
  constructor() {
    this.socket = null;
    this.userId = this.generateUserId();
  }

  generateUserId() {
    return `user_${Math.random().toString(36).substr(2, 9)}`;
  }

  connect(roomId = "default") {
    this.socket = io("http://localhost:8000", {
      query: { roomId, userId: this.userId },
    });

    this.socket.on("connect", () => {
      console.log("Connected to server");
    });

    return this.socket;
  }

  emitDrawAction(action) {
    if (!this.socket) return;

    this.socket.emit("draw-action", {
      ...action,
      userId: this.userId,
      timestamp: Date.now(),
    });
  }

  emitCursorMove(point) {
    if (!this.socket) return;

    this.socket.emit("cursor-move", {
      userId: this.userId,
      point,
      timestamp: Date.now(),
    });
  }

  onDrawAction(callback) {
    if (!this.socket) return;
    this.socket.on("draw-action", callback);
  }

  onCursorMove(callback) {
    if (!this.socket) return;
    this.socket.on("cursor-move", callback);
  }

  onCanvasState(callback) {
    if (!this.socket) return;
    this.socket.on("canvas-state", callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new SocketClient();
