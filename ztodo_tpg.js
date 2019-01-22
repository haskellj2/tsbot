const WebSocket = require('ws');

var ws;

sendMessage = function(msg) {
    console.log(msg);

    if (ws !== undefined && ws.readyState === 1) {
        ws.send(JSON.stringify(msg));
    }
};

open_WS_connection = function() {


    ws = new WebSocket('wss://DESKTOP-N4', {
        'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
        'Sec-WebSocket-Key': 'jJLjJYNhbXBsZSBub25jZQ==',
        'Sec-WebSocket-Version': '13',
    });

    ws.on('close', function(code, message) {
        console.log('disconnected');

        // reconnection
        open_WS_connection();

    });



    ws.on('message', function incoming(data) {
        console.log(data);

        if (data === 'o') {
            console.log('reconnected');
            //sendMessage('{ "_event": "subscribe", "tzID": 55, "message": "domain-1:" }');

            return;
        }

        var message = data;
        if (!(/^\d+$/).test(message)) {
            if (message.substr(0, 1) === 'a') {
                var messageEx = JSON.parse(message.substr(1, message.length - 1))[0];
                messageEx = JSON.parse(messageEx);
                if (messageEx._event === 'heartbeat') { return; }

                if (messageEx.message.startsWith('pid-')) {
                    let jsonMsg = JSON.parse(messageEx.message.substr(messageEx.message.indexOf('::') + 2));

                    const pid = parseInt(jsonMsg.pid);
                    const last = parseFloat(jsonMsg.last);
                    const bid = parseFloat(jsonMsg.bid);
                    const ask = parseFloat(jsonMsg.ask);
                    const high = parseFloat(jsonMsg.high);
                    const low = parseFloat(jsonMsg.low);
                    let last_close = parseFloat(jsonMsg.last_close);
                    const pc = jsonMsg.pc;
                    const pcp = jsonMsg.pcp;
                    let turnover = jsonMsg.turnover;
                    let turnover_numeric = parseFloat(jsonMsg.turnover_numeric);
                    let time = jsonMsg.time;
                    let times = time.split(':');
                    times[0] = parseInt(times[0]) + (parseInt(times[0]) < 4 ? 20 : (-4));
                    time = (times[0] > 9 ? '' : '0') + times[0].toString() + ':' + times[1] + ':' + times[2];

                    const timestamp = jsonMsg.timestamp;

                    let date = new Date();
                    date.setHours(0, 0, 0, 0);

                    if (isNaN(last_close)) { last_close = 0.00; }
                    if (turnover === undefined) { turnover = ''; }
                    if (isNaN(turnover_numeric)) { turnover_numeric = 0; }

                    const updateQuery = {
                        text: `INSERT INTO t.irealtime(pid, last, bid, ask, high, low, last_close, pc, pcp, turnover, turnover_numeric, time, timestamp, date) 
                            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                        values: [pid, last, bid, ask, high, low, last_close, pc, pcp, turnover, turnover_numeric, time, timestamp, date]
                    };

                } else if (messageEx.message.startsWith('pidExt-')) {
                    let jsonMsg = JSON.parse(messageEx.message.substr(messageEx.message.indexOf('::') + 2));

                    const pid = parseInt(jsonMsg.pid);
                    const last = parseFloat(jsonMsg.last);
                    const bid = parseFloat(jsonMsg.bid);
                    const ask = parseFloat(jsonMsg.ask);
                    //const high = parseFloat(jsonMsg.high);0.00
                    //const low = parseFloat(jsonMsg.low);0.00
                    const pc = jsonMsg.pc;
                    const pcp = jsonMsg.pcp;


                    if (isNaN(turnover_numeric)) { turnover_numeric = 0; }

                    var turnover = jsonMsg.turnover;
                    var turnover_numeric = 0;
                    if (turnover === undefined) {
                        turnover = '';
                    } else {
                        turnover_numeric = Math.round(turnover.replace(',', '').replace('M', '').replace('K', '') * (turnover.indexOf('M') > -1 ? 1000000 : 1) * (turnover.indexOf('K') > -1 ? 1000 : 1));
                    }

                    let time = jsonMsg.time;
                    let times = time.split(':');
                    times[0] = parseInt(times[0]) + (parseInt(times[0]) < 4 ? 20 : (-4));
                    time = (times[0] > 9 ? '' : '0') + times[0].toString() + ':' + times[1] + ':' + times[2];

                    const timestamp = jsonMsg.timestamp;

                    let date = new Date();
                    date.setHours(0, 0, 0, 0);

                    const updateQuery = {
                        text: `INSERT INTO t.iexthours(pid, last, bid, ask, pc, pcp, turnover, turnover_numeric, time, timestamp, date) 
                            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                        values: [pid, last, bid, ask, pc, pcp, turnover, turnover_numeric, time, timestamp, date]
                    };

                    pool.query(updateQuery)
                        .then(res => {
                            //console.log(res.command + ' : ' + pid + ' ' + pcp + ' ' + res.rowCount + ' row(s)');
                        })
                        .catch(err => {
                            console.log(updateQuery.values);
                            console.error(err.stack);
                        });


                }

            }
        }
    });
};


open_WS_connection();