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
    let playerId = null;
    socket.on("start", (data) => {
        playerId = data && data.id ? data.id : socket.id;
        players[playerId] = {
            position: {
                x: Math.random() * 50,
                y: 4,
                z: Math.random() * 50,
            },
            rotationY: 0,
            health: 10,
            skinUrl: null,
            isWalking: false,
            name: data && data.name ? data.name : playerId
        };
        socket.emit("currentPlayers", players);
        socket.broadcast.emit("newPlayer", {
            id: playerId,
            position: players[playerId].position,
            rotationY: players[playerId].rotationY,
            skinUrl: players[playerId].skinUrl,
            isWalking: players[playerId].isWalking,
            name: players[playerId].name
        });
    });
    socket.on("move", ({ id, position, rotationY, isWalking }) => {
        if (!players[id]) return;
        players[id].position.x = position.x;
        players[id].position.y = position.y;
        players[id].position.z = position.z;
        players[id].rotationY = rotationY;
        players[id].isWalking = isWalking;
        socket.broadcast.emit("playerMoved", {
            id,
            position: players[id].position,
            rotationY: players[id].rotationY,
            isWalking: players[id].isWalking
        });
    });
    socket.on('playerState', (data) => {
        if (!players[data.id]) return;
        players[data.id].health = data.health;
        players[data.id].rotationY = data.rotationY;
        players[data.id].isWalking = data.isWalking;
        socket.broadcast.emit('playerState', {
            id: data.id,
            position: data.position,
            rotationY: data.rotationY,
            isWalking: data.isWalking,
            health: data.health,
            name: data.name
        });
    });
    socket.on('updateHealth', ({ targetId, health }) => {
        if (players[targetId]) {
            players[targetId].health = health;
            io.emit('updateHealth', { id: targetId, health });
        }
    });
    socket.on("disconnect", () => {
        if (playerId && players[playerId]) {
            delete players[playerId];
            io.emit("playerDisconnected", playerId);
        }
    });
});

app.get("/healthz", (req, res) => {
    res.status(200).send("OK");
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
