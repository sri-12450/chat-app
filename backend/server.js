// backend/server.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

// ----- Example API route ----- //
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// ----- Serve React build ----- //
const buildPath = path.join(__dirname, "build");
app.use(express.static(buildPath));

// ----- Catch-all route for React frontend ----- //
app.get('/:path(.*)', (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// ----- Socket.io setup ----- //
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store online users
let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", ({ username, room }) => {
    socket.join(room);
    onlineUsers[socket.id] = { username, room };
    updateOnlineUsers(room);
  });

  socket.on("typing", ({ room, username }) => {
    socket.to(room).emit("typing", { username });
  });

  socket.on("send_message", (data) => {
    io.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    const user = onlineUsers[socket.id];
    if (user) {
      updateOnlineUsers(user.room, socket.id);
      delete onlineUsers[socket.id];
    }
  });

  function updateOnlineUsers(room, removedId) {
    const usersInRoom = Object.entries(onlineUsers)
      .filter(([id, u]) => u.room === room && id !== removedId)
      .map(([id, u]) => u.username);
    io.to(room).emit("online_users", usersInRoom);
  }
});

// ----- Start Server ----- //
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

