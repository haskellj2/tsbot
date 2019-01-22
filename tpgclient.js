var WebSocket = require('ws');

function openConnection() {
    ws = new WebSocket('ws://DESKTOP-N4:8223', {
        'perMessageDeflate': false,
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Connection': 'Upgrade',
        'origin': 'https://www.investing.com',
        'Pragma': 'no-cache',
        'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
        'Sec-WebSocket-Key': 'jJLjJYNhbXBsZSBub25jZQ==',
        'Sec-WebSocket-Version': '13',
        'Upgrade': 'websocket',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Mobile Safari/537.36'

    });

    var reconnect;

    ws.on('open', function() {
        if (reconnect) {
            clearTimeout(reconnect);
            console.log('reconnect succeeded...clear retrying connection...%s %s', new Date().toLocaleDateString(), new Date().toLocaleTimeString());
        }
        ws.send(JSON.stringify({ "msg": "something from client" }));
    });

    ws.on('message', function(message) {
        console.log('received: %s from service %s %s', JSON.parse(message).msg, new Date().toLocaleDateString(), new Date().toLocaleTimeString());
    });


    ws.on('close', function close() {
        console.log('disconnected %s %s', new Date().toLocaleDateString(), new Date().toLocaleTimeString());
        reconnect = setTimeout(function() {
            console.log('trying to reconnect... %s %s', new Date().toLocaleDateString(), new Date().toLocaleTimeString());
            openConnection();
        }, 5000);
    });

    ws.on('error', function(err) {
        console.log('handled error');
        console.error('Error2: %s', err.stack);
    });
}

openConnection();