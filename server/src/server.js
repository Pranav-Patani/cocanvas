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

io.on("connection", (socket) => {
  const { roomId, userId } = socket.handshake.query;

  console.log(`User ${userId} connected to room ${roomId}`);

  socket.join(roomId);
  roomManager.addUser(roomId, userId, socket.id);

  const canvasState = roomManager.getCanvasState(roomId);
  socket.emit("canvas-state", canvasState);

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
    });
  });
});

server.listen(8000, () => {
  console.log(`Server running on port 8000`);
});
