var pidArray = [960631, 16782, 28172, 20518, 42585, 17323];




const https = require('https');
const cheerio = require('cheerio');

const { Pool } = require('pg');

const botdbConfig = require('./ts_configurations').get_bot_db_config();
const pool = new Pool(botdbConfig);





const WebSocket = require('ws');

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

            const updateQuery = {
                text: `INSERT INTO t.irealtime(pid, last, bid, ask, high, low, last_close, pc, pcp, turnover, turnover_numeric, time, timestamp, date`,
                values: [pid, last, bid, ask, high, low, last_close, pc, pcp, turnover, turnover_numeric, time, timestamp, date]
            };

            return pool.query(updateQuery)
                .then(res => {
                    console.log(res.command + ' : ' + pid + ' ' + pcp + ' ' + res.rowCount + ' row(s)');
                })
                .catch(err => {
                    console.error(err.stack);
                });




        }


    }








});













refreshList = function() {

    const options = {
        hostname: 'www.investing.com',
        port: 443,
        path: '/equities/top-stock-gainers',
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Mobile Safari/537.36',
            'accept': '*/*'
        },

    };

    var igResponse = '';

    const req = https.request(options, (res) => {

        console.log('statusCode', res.statusCode);
        console.log('statusMessage', res.statusMessage);

        res.on('data', (d) => {
            //process.stdout.write(d);
            if (igResponse.length < 500000) {
                igResponse += d;
            }
        });

        res.on('end', () => {
            igResponse = igResponse.substr(igResponse.indexOf("genTbl closedTbl elpTbl elp25 crossRatesTbl") - 14, 50000);
            igResponse = igResponse.substr(0, igResponse.indexOf("</table>") + 8);
            //console.log(igResponse);

            const $ = cheerio.load(igResponse);
            $('table.genTbl > tbody > tr').each((idx, item) => {
                const pid = $('td[class="left bold plusIconTd elp"] > span', item).prop('data-id');

                const fullname = $('td[class="left bold plusIconTd elp"] > a', item).prop('title');
                const url = $('td[class="left bold plusIconTd elp"] > a', item).prop('href');
                const name = $('td[class="left bold plusIconTd elp"] > a', item)[0].childNodes[0].data;

                const last = $('td[class="align_right pid-' + pid + '-last"]', item)[0].childNodes[0].data;
                const high = $('td[class="align_right pid-' + pid + '-high"]', item)[0].childNodes[0].data;
                const low = $('td[class="pid-' + pid + '-low"]', item)[0].childNodes[0].data;
                const pc = $('td[class="bold greenFont pid-' + pid + '-pc"]', item)[0].childNodes[0].data;

                const pcp = $('td[class="bold greenFont pid-' + pid + '-pcp"]', item)[0].childNodes[0].data;
                const pcpnumeric = parseFloat(pcp.replace('%', ''));

                const turnover = $('td[class="pid-' + pid + '-turnover"]', item)[0].childNodes[0].data;
                const turnovernumeric = Math.round(turnover.replace(',', '').replace('M', '').replace('K', '') * (turnover.indexOf('M') > -1 ? 1000000 : 1) * (turnover.indexOf('K') > -1 ? 1000 : 1));

                var time = $('td[class="pid-' + pid + '-time"]', item)[0].childNodes[0].data;
                var times = time.split(':');
                time = ('0' + (parseInt(times[0]) - 4).toString()).substr((parseInt(times[0]) - 4 > 9 ? 1 : 0), 2) + ':' + times[1] + ':' + times[2];

                var date = new Date();
                date.setHours(0, 0, 0, 0);

                if (time.indexOf('/') > -1) {
                    time = '16:00:00';
                }

                if (new Date().getDay() == 0) {
                    date.setDate(date.getDate() - 2);
                } else if (new Date().getDay() == 7) {
                    date.setDate(date.getDate() - 1);
                } else if (new Date().getDay() == 1 && new Date().getHours() < 9) {
                    date.setDate(date.getDate() - 3);
                } else if (new Date().getHours() < 9) {
                    date.setDate(date.getDate() - 1);
                }


                pool.connect((err, client, done) => {
                    const shouldAbort = (err) => {
                        if (err !== null) {
                            console.error('Error in transaction', err.stack);
                            client.query('ROLLBACK', (err) => {
                                if (err) {
                                    console.error('Error rolling back client', err.stack);
                                }
                                // release the client back to the pool
                                done();
                            });
                        }
                        return !!err;
                    };

                    const selectQuery = {
                        text: 'SELECT * FROM t.igainers WHERE pid = $1 AND time = $2 AND date = $3',
                        values: [parseInt(pid), time, date]
                    };

                    client.query('BEGIN', (err) => {
                        if (shouldAbort(err)) return;

                        client.query(selectQuery, (err, res) => {
                            if (shouldAbort(err)) return;

                            if (res.rows.length > 0) {
                                console.log('already done - ' + name + ' ' + pid);

                                client.query('ROLLBACK', (err) => {
                                    if (shouldAbort(err)) return;

                                    console.log(res.command + ' : ' + pid + ' ' + name + ' - ' + res.rowCount + ' row(s)');
                                    done(); // done COMMIT
                                });
                            } else {

                                const updateQuery = {
                                    text: 'INSERT INTO t.igainers(pid, last, high, low, pc, pcp, turnover, time, date, fullname, name, url, pcpnumeric, turnovernumeric) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
                                    values: [parseInt(pid), parseFloat(last), parseFloat(high), parseFloat(low), pc, pcp, turnover, time, date, fullname, name, url, pcpnumeric, turnovernumeric]
                                };

                                client.query(updateQuery, (err, res) => {
                                    if (shouldAbort(err)) return;

                                    client.query('COMMIT', (err) => {
                                        if (shouldAbort(err)) return;

                                        console.log(res.command + ' : ' + pid + ' ' + name + ' - ' + res.rowCount + ' row(s)');
                                        done();
                                    });
                                });

                            }
                        });
                    });
                });

            });

            console.log('table done');
        });
        console.log('res end');
    });



    //req.on('error', (e) => {
    //    console.error(e);
    //});

    req.end(function() {
        console.log('req end');
    });

}