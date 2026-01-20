const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const RoomManager = require("./rooms");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://192.168.1.0/24", // Allow entire local network
      /^http:\/\/192\.168\.\d+\.\d+:5173$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:5173$/,
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:5173$/,
    ],
  },
});

const roomManager = new RoomManager();

const generateUserColor = (userId) => {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#FFA07A", // Orange
    "#98D8C8", // Mint
    "#F7DC6F", // Yellow
    "#BB8FCE", // Purple
    "#85C1E2", // Sky Blue
  ];
  const hash = userId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

io.on("connection", (socket) => {
  const { roomId } = socket.handshake.query;
  const userId = socket.id;

  console.log(`User ${userId} connected to room ${roomId}`);

  socket.join(roomId);
  const userColor = generateUserColor(userId);

  roomManager.addUser(roomId, userId, socket.id, userColor);

  socket.emit("init", {
    userId,
    roomId,
    color: userColor,
  });

  socket.on("user-data", (userData) => {
    roomManager.updateUserName(roomId, userId, userData.userName);

    const updatedUsers = roomManager.getUsers(roomId);

    io.to(roomId).emit("users-update", updatedUsers);
  });

  const canvasState = roomManager.getCanvasState(roomId);
  socket.emit("canvas-state", canvasState);

  const existingUsers = roomManager.getUsers(roomId);
  socket.emit("users-update", existingUsers);

  socket.to(roomId).emit("user-joined", {
    userId,
    color: userColor,
    timestamp: Date.now(),
  });

  io.to(roomId).emit("users-update", existingUsers);

  socket.on("draw-action", (action) => {
    const fullAction = { ...action, userId };
    const actionId = roomManager.addAction(roomId, fullAction);

    socket.to(roomId).emit("draw-action", {
      ...fullAction,
      actionId,
    });

    if (action.type === "end") {
      const state = roomManager.getCanvasState(roomId);
      socket.to(roomId).emit("state-update", {
        canUndo: state.canUndo,
        canRedo: state.canRedo,
      });
    }
  });

  socket.on("draw-action-batch", (batch) => {
    const processedActions = [];

    batch.actions.forEach((action) => {
      const fullAction = { ...action, userId };
      const actionId = roomManager.addAction(roomId, fullAction);

      processedActions.push({
        ...fullAction,
        actionId,
      });
    });

    socket.to(roomId).emit("draw-action-batch", {
      actions: processedActions,
      batchId: batch.batchId,
    });

    const hasEndAction = batch.actions.some((action) => action.type === "end");
    if (hasEndAction) {
      const state = roomManager.getCanvasState(roomId);
      socket.to(roomId).emit("state-update", {
        canUndo: state.canUndo,
        canRedo: state.canRedo,
      });
    }
  });

  socket.on("cursor-move", (data) => {
    socket.to(roomId).emit("cursor-move", {
      userId,
      point: data.point,
      timestamp: data.timestamp,
    });
  });

  socket.on("undo", () => {
    const result = roomManager.undo(roomId);
    io.to(roomId).emit("undo-done", result);
  });

  socket.on("redo", () => {
    const result = roomManager.redo(roomId);
    io.to(roomId).emit("redo-done", result);
  });

  socket.on("disconnect", () => {
    console.log(`User ${userId} disconnected`);
    const room = roomManager.rooms.get(roomId);
    if (room) {
      room.drawingState.finalizeIncompleteStroke();
    }
    roomManager.removeUser(roomId, userId);
    socket.to(roomId).emit("user-left", {
      userId,
      timestamp: Date.now(),
    });

    const remainingUsers = roomManager.getUsers(roomId);
    socket.to(roomId).emit("users-update", remainingUsers);
  });
});

server.listen(8000, () => {
  console.log(`Server running on port 8000`);
});
