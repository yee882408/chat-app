// pages/api/socket.js

import { Server } from "socket.io";

export default function handler(req, res) {
    if (!res.socket.server.io) {
        const io = new Server(res.socket.server, {
            path: "/api/socket_io",
            addTrailingSlash: false,
        });

        io.on("connection", (socket) => {
            console.log("User connected");

            socket.on("chat-message", (msg) => {
                socket.broadcast.emit("chat-message", msg);
            });

            socket.on("disconnect", () => {
                console.log("User disconnected");
            });
        });

        res.socket.server.io = io;
    }
    res.end();
}
