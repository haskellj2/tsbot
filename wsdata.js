const WebSocket = require('ws');

const pidArray = [960631, 16782, 28172, 20518, 42585, 17323];

const ws = new WebSocket('wss://stream33.forexpros.com/echo/330/qa2gt7qw/websocket', {
    origin: 'https://www.investing.com'
});

ws.on('close', function(code, message) {
    console.log('connected');
    //ws.send(Date.now());

    // reconnection

});


ws.on('close', function close() {
    console.log('disconnected');
});

sendMessage = function(msg) {
    if (ws.readyState === 1) {
        ws.send(JSON.stringify(msg));
    }
};

ws.on('message', function incoming(data) {
    //console.log(`Roundtrip time: ${Date.now() - data} ms`);

    //setTimeout(function timeout() {
    //    ws.send(Date.now());
    //}, 500);

    if (data === 'o') {
        for (var i = 0, len = pidArray.length; i < len; i++) {
            sendMessage('{"_event":"subscribe","tzID":55,"message":"pid-' + pidArray[i] + ':" }');
            sendMessage('{"_event":"subscribe","tzID":55,"message":"pidExt-' + pidArray[i] + ':" }');
        }

        sendMessage({ "_event": "UID", "UID": 0 });
        sendMessage({ "_event": "heartbeat", "data": "h" });

        setInterval(function() {
            sendMessage({ "_event": "heartbeat", "data": "h" });
        }, 4000);

        return;
    }

    var message = data;
    if (!(/^\d+$/).test(message)) {
        if (message.substr(0, 1) === 'a') {
            var messageEx = JSON.parse(message.substr(1, message.length - 1))[0];
            messageEx = JSON.parse(messageEx);
            if (messageEx._event === 'heartbeat') { return; }

            var jsonMsg = JSON.parse(messageEx.message.substr(messageEx.message.indexOf('::') + 2));

            const pid = parseInt(jsonMsg.pid);
            const last = parseFloat(jsonMsg.last);
            const bid = parseFloat(jsonMsg.big);
            const ask = parseFloat(jsonMsg.ask);
            const high = parseFloat(jsonMsg.high);
            const low = parseFloat(jsonMsg.low);
            const last_close = parseFloat(jsonMsg.last_close);
            const pc = jsonMsg.pc;
            const pcp = jsonMsg.pcp;
            const turnover = jsonMsg.turnover;
            const turnover_numeric = parseFloat(jsonMsg.turnover_numeric);
            var time = jsonMsg.time;
            var times = time.split(':');
            time = ('0' + (parseInt(times[0]) - 4).toString()).substr((parseInt(times[0]) - 4 > 9 ? 1 : 0), 2) + ':' + times[1] + ':' + times[2];

            const timestamp = jsonMsg.timestamp;

            const date = new Date().setHours(0, 0, 0);





        }


    }








});