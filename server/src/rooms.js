const DrawingState = require("./drawingState");

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  addUser(roomId, userId, socketId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        users: new Map(),
        drawingState: new DrawingState(roomId),
        createdAt: Date.now(),
      });
      console.log(`Created new room: ${roomId}`);
    }

    const room = this.rooms.get(roomId);
    room.users.set(userId, {
      socketId,
      joinedAt: Date.now(),
    });

    console.log(
      `User ${userId} joined room ${roomId}. Total users: ${room.users.size}`,
    );
  }

  removeUser(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.users.delete(userId);
    console.log(
      `User ${userId} left room ${roomId}. Remaining users: ${room.users.size}`,
    );

    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      console.log(`Room ${roomId} destroyed (no users remaining)`);
    }
  }

  addAction(roomId, action) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return room.drawingState.addAction(action);
  }

  getCanvasState(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { actions: [] };
    }

    return room.drawingState.getState();
  }
}

module.exports = RoomManager;
