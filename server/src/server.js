const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const RoomManager = require("./rooms");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
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
  const { roomId, userId } = socket.handshake.query;

  console.log(`User ${userId} connected to room ${roomId}`);

  socket.join(roomId);
  const userColor = generateUserColor(userId);
  roomManager.addUser(roomId, userId, socket.id, userColor);

  const canvasState = roomManager.getCanvasState(roomId);
  socket.emit("canvas-state", canvasState);

  socket.to(roomId).emit("user-joined", {
    userId,
    color: userColor,
    timestamp: Date.now(),
  });

  const existingUsers = roomManager.getUsers(roomId);
  socket.emit("users-update", existingUsers);

  socket.on("draw-action", (action) => {
    const actionId = roomManager.addAction(roomId, action);

    socket.to(roomId).emit("draw-action", {
      ...action,
      actionId,
    });
  });

  socket.on("cursor-move", (data) => {
    socket.to(roomId).emit("cursor-move", {
      userId,
      point: data.point,
      timestamp: data.timestamp,
    });
  });

  socket.on("disconnect", () => {
    console.log(`User ${userId} disconnected`);
    roomManager.removeUser(roomId, userId);
    socket.to(roomId).emit("user-left", {
      userId,
      timestamp: Date.now(),
    });
  });
});

server.listen(8000, () => {
  console.log(`Server running on port 8000`);
});
