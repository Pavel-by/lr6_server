import http from "http";
import app from './app';
import Server from 'socket.io';
import {MarketService} from "./core/MarketService";

let appSettings = {
    port: 3000,
    host: 'lr6.test'
};
let socket = Server({
    path: '/socket'
});
MarketService.instance.init(socket);

let server = http.createServer(app);
socket.attach(server, {
    cors: {
        origin: "http://localhost",
        methods: ["GET", "POST"]
    }
});
server.listen(appSettings.port);

server.on('listening', () => {
    console.log(`Listening on ${appSettings.port}`);
});
