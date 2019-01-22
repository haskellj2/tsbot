const WebSocket = require('ws');
const _ = require("underscore");

const wss = new WebSocket.Server({
    verifyClient: (info) => {
        //info.req.headers['sec-websocket-key'] === 'jJLjJYNhbXBsZSBub25jZQ==' && 
        return info.req.connection.remoteAddress === '::ffff:' + getLocalIP();
    },
    port: 8223
});

wss.on('connection', (ws, req) => {
    //const ip = req.connection.remoteAddress;
    // When the server runs behind a proxy like NGINX, the de-facto standard is to use the X-Forwarded-For header.
    //const ip = req.headers['x-forwarded-for'];

    /* - heartbeat based on ping/pong 1 of 2
    ws.isAlive = true;
    ws.on('pong', heartbeat);
    */

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

    /*
        client.on('message', message => {
            if (message.method === 'Save2pg') {
                Mpg.Save2pg(message.data);
            } else if (message.method === 'getSymbByPid') {
                Mpg.getSymbByPid(message.data)
                    .then((res) => {
                        client.send({ datatype: 'symbol', data: res.symb });
                    })
                    .catch(err => {
                        console.error('Error: ' + err.stack + '\n\n' + 'Details: ' + message);
                    });
            }
        });

        client.send('o');
    */

});

/* - heartbeat based on ping/pong 2 of 2
function heartbeat() {
    console.log('client isAlive %s %s', new Date().toLocaleDateString(), new Date().toLocaleTimeString());
    this.isAlive = true;
}

const interval = setInterval(function ping() {
    console.log('# of client: %s', wss.clients.size);
    wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) {
            console.log('terminate client %s %s', new Date().toLocaleDateString(), new Date().toLocaleTimeString());
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping('', false, true);
    });
}, 5000);
*/



function getLocalIP() {
    const interfaces = require('os').networkInterfaces();
    return _.find(interfaces.Ethernet, ethernet => ethernet.family === 'IPv4').address;
}