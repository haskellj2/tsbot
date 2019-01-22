const WebSocket = require('ws');
const _ = require("underscore");

//https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback
const wss = new WebSocket.Server({
    verifyClient: (info) => {
        //info.orign === 'https://www.investing.com'
        //info.req.headers['sec-websocket-key'] === 'jJLjJYNhbXBsZSBub25jZQ==' && 
        console.log(`info.req.connection.remoteAddress ${info.req.connection.remoteAddress}`);
        console.log(`getLocalIP() ${getLocalIP()}`);
        return info.req.connection.remoteAddress === '::ffff:' + getLocalIP();
    },
    port: 8223
});

wss.on('connection', (ws, req) => {
    //const ip = req.connection.remoteAddress;
    // When the server runs behind a proxy like NGINX, the de-facto standard is to use the X-Forwarded-For header.
    //const ip = req.headers['x-forwarded-for'];
    ws.isAlive = true;
    ws.on('pong', heartbeat);

    ws.on('message', function(message) {
        console.log('received: %s from client', JSON.parse(message).msg);
    });

    ws.on('error', function(err) {
        console.error('ws error: %s', err.stack);
    });

    ws.on('close', function() {
        console.log('ws close');
    });

    ws.send(JSON.stringify({ "msg": "something from service" }));
});

function heartbeat() {
    console.log('client isAlive %s %s', new Date().toLocaleDateString(), new Date().toLocaleTimeString());
    this.isAlive = true;
}

const interval = setInterval(function ping() {
    console.log(`# of client: ${wss.clients.size}`);
    wss.clients.forEach(function each(ws) {
        // ws.readyState == 1 : ws.CONNECTING (0) ws.OPEN (1) ws.CLOSING (2) ws.CLOSED (3)
        if (ws.isAlive === false) {
            console.log('terminate client %s %s', new Date().toLocaleDateString(), new Date().toLocaleTimeString());
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping('', false, true);
    });
}, 3000);

function getLocalIP() {
    const interfaces = require('os').networkInterfaces();
    return _.find(interfaces.Ethernet, ethernet => ethernet.family === 'IPv4').address;
}