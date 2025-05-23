// const express = require("express");
// const app = express();
// const PORT = 8000;

// const path = require("path");
// const http = require("http");

// const {Server} = require ("socket.io");

// const server = http.createServer(app);

// const io = new Server (server);

// io.on ("connection", (socket)=> {
//     socket.on ("usermessage", (message)=>{
//         io.emit ("message", message);
//     })
// })

// // Serve the index.html file
// app.get("/", (req, res) => {
//     res.sendFile(path.join(__dirname, "public", "index.html"));
// });

// // Serve static files from the "public" directory
// app.use(express.static(path.join(__dirname, "public")));

// server.listen(PORT, () => console.log(`Server started at PORT ${PORT}`));

const express = require("express");
const app = express();
const PORT = 8000;

const path = require("path");
const http = require("http");

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Track connected users
const users = new Map();

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Wait for the client to send the username
  socket.on("setUsername", (username) => {
    users.set(socket.id, { username, active: true });

    socket.emit("yourInfo", { username }); // written because, so that client should know the current user (sender) & (receiver)

    // Notify everyone about new connection
    io.emit("userCount", { count: users.size });
    io.emit("userJoined", { username, timestamp: new Date() });
  });

  // Handle incoming messages
  socket.on("usermessage", (message) => {
    const user = users.get(socket.id);
    if (user) {
      // Broadcast to everyone EXCEPT the sender
      socket.broadcast.emit("message", {
        username: user.username,
        text: message,
        timestamp: new Date(),
        isCurrentUser: false,
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      io.emit("userLeft", { username: user.username, timestamp: new Date() });
      io.emit("userCount", { count: users.size });
    }
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Serve the index.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

server.listen(PORT, () => console.log(`Server started at PORT ${PORT}`));
