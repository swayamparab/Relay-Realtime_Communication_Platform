import {Server as HttpServer} from "http"
import {Server} from "socket.io"
import { env } from "../config/env"
import { handleConnection } from "./events/connection.event"
import { socketAuth } from "./middleware/auth.middleware"
import { setSocketServer } from "./socket-server"

export function createSocketServer(server: HttpServer){
    const io = new Server(server, {
        cors: {
            origin: env.CLIENT_URL,
            credentials: true
        },

        pingInterval: 10000,
        pingTimeout: 10000
    })

    setSocketServer(io);

    io.use(socketAuth);

    io.on("connection", (socket)=>{
        handleConnection(io,socket)
    })

    return io;
}
