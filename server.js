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
                y: 0,
                z: Math.random() * 50,
            },
            rotationY: 0, // <-- ADDED: Initialize rotationY
            health: 10,
            skinUrl: null,
            isWalking: false, // <-- ADDED: Initialize isWalking
        };

        // Send current players data to the newly connected player
        socket.emit("currentPlayers", players);

        // Broadcast new player info to existing players
        socket.broadcast.emit("newPlayer", {
            id: socket.id,
            position: players[socket.id].position,
            rotationY: players[socket.id].rotationY, // <-- ADDED: Send rotationY
            skinUrl: players[socket.id].skinUrl,
            isWalking: players[socket.id].isWalking, // <-- ADDED: Send isWalking
        });
    });

    socket.on("move", ({ position, rotationY, isWalking }) => { // <-- MODIFIED: Receive rotationY and isWalking
        if (!players[socket.id]) return;

        // Update player's position, rotationY, and isWalking state on server
        players[socket.id].position.x = position.x;
        players[socket.id].position.y = position.y;
        players[socket.id].position.z = position.z;
        players[socket.id].rotationY = rotationY; // <-- ADDED: Update rotationY
        players[socket.id].isWalking = isWalking; // <-- ADDED: Update isWalking

        // Broadcast updated position, rotationY, and isWalking to other clients
        socket.broadcast.emit("playerMoved", {
            id: socket.id,
            position: players[socket.id].position,
            rotationY: players[socket.id].rotationY, // <-- ADDED: Send rotationY
            isWalking: players[socket.id].isWalking, // <-- ADDED: Send isWalking
        });
    });

    socket.on("disconnect", () => {
        console.log(`Player disconnected: ${socket.id}`);
        delete players[socket.id];
        io.emit("playerDisconnected", socket.id);
    });
});

app.get("/healthz", (req, res) => {
    res.status(200).send("OK");
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
