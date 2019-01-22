const WebSocket = require('ws');
const wss = new WebSocket.Server({
    verifyClient: (info) => info.req.headers['sec-websocket-key'] === 'jJLjJYNhbXBsZSBub25jZQ==' && req.connection.remoteAddress === getLocalIP,
    port: 8223
});

function heartbeat() {
    this.isAlive = true;
}

const _ = require('underscore');

var Mpg = require('./mpg.js');

wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.on('pong', heartbeat);

    ws.on('message', message => {
        if (message.method === 'Save2pg') {
            Mpg.Save2pg(message.data);
        } else if (message.method === 'getSymbByPid') {
            Mpg.getSymbByPid(message.data)
                .then((res) => {
                    ws.send({ datatype: 'symbol', data: res.symb });
                })
                .catch(err => {
                    console.error('Error: ' + err.stack + '\n\n' + 'Details: ' + message);
                });
        }
    });


});

// ping messages can be used as a means to verify that the remote endpoint is still responsive.
// pong messages are automatically sent in response to ping messages as required by the spec.
const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) return ws.terminate();

        ws.isAlive = false;
        ws.ping('', false, true);
    });
}, 30000);

function getLocalIP() {
    const interfaces = require('os').networkInterfaces;
    return _.find(interfaces.Ethernet, ethernet => ethernet.family === 'IPv4').address;
}