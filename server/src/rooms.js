const DrawingState = require("./drawingState");

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  addUser(roomId, userId, socketId, color) {
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
      color,
      joinedAt: Date.now(),
    });

    console.log(
      `User ${userId} joined room ${roomId}. Total users: ${room.users.size}`,
    );
  }

  updateUserName(roomId, userId, userName) {
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      if (room.users.has(userId)) {
        const user = room.users.get(userId);
        user.userName = userName;
        room.users.set(userId, user);
      }
    }
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

  getUsers(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room.users.entries()).map(([userId, userData]) => ({
      userId,
      userName: userData.userName,
      color: userData.color,
      joinedAt: userData.joinedAt,
    }));
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

  undo(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, canUndo: false, canRedo: false, actions: [] };
    }

    return room.drawingState.undo();
  }

  redo(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, canUndo: false, canRedo: false, actions: [] };
    }

    return room.drawingState.redo();
  }
}

module.exports = RoomManager;
