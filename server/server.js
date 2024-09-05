const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const users = new Map();

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("set username", (username) => {
    users.set(socket.id, { username, id: socket.id });
    socket.username = username;
    io.emit("user joined", username);
    io.emit("update users", Array.from(users.values()));
  });

  socket.on("chat message", (msg) => {
    io.emit("chat message", { user: socket.username, message: msg });
  });

  socket.on("private message", ({ to, message }) => {
    const recipient = Array.from(users.values()).find(
      (user) => user.username === to
    );
    if (recipient) {
      io.to(recipient.id).emit("private message", {
        from: socket.username,
        message,
      });
    }
  });

  socket.on("typing", (isTyping) => {
    socket.broadcast.emit("user typing", { user: socket.username, isTyping });
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      users.delete(socket.id);
      io.emit("user left", socket.username);
      io.emit("update users", Array.from(users.values()));
    }
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
