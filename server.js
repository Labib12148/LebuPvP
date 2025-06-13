const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use(express.static(path.join(__dirname)));

const players = {};

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on("start", () => {
  players[socket.id] = {
    position: {
      x: Math.random() * 50,
      y: 4,
      z: Math.random() * 50,
    },
    health: 10,
    skinUrl: null,
  };

  socket.emit("currentPlayers", players);

  socket.broadcast.emit("newPlayer", {
    id: socket.id,
    position: players[socket.id].position,
    skinUrl: players[socket.id].skinUrl,
  });
});

  socket.on("move", ({ position }) => {
    if (!players[socket.id]) return;

    // Update player's position on server
    players[socket.id].position.x = position.x;
    players[socket.id].position.y = position.y;
    players[socket.id].position.z = position.z;

    // Broadcast updated position to other clients
    socket.broadcast.emit("playerMoved", {
      id: socket.id,
      position: players[socket.id].position,
    });
  });

  socket.on("attack", ({ damage }) => {
    const attacker = players[socket.id];
    if (!attacker) return;

    for (const id in players) {
      if (id === socket.id) continue;

      const target = players[id];
      const dx = attacker.position.x - target.position.x;
      const dz = attacker.position.z - target.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < 2) {
        target.health -= damage;
        if (target.health < 0) target.health = 0;

        io.to(id).emit("gotHit", damage);

        if (target.health <= 0) {
          target.health = 10;
          target.position = {
            x: Math.random() * 50,
            y: 4,
            z: Math.random() * 50,
          };

          io.emit("playerMoved", { id, position: target.position });
          io.to(id).emit("gotHit", target.health);
}

      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit("playerDisconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
