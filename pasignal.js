var pidArray = []; //[1, 2, 3, 5, 7, 8830, 8839, 8874];




const https = require('https');
const cheerio = require('cheerio');

const { Pool } = require('pg');

const botdbConfig = {
    host: 'localhost',
    port: 2828,
    database: 'botdb',
    user: 'botuser',
    password: '~Fly777',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,

};

const pool = new Pool(botdbConfig);




const WebSocket = require('ws');

var ws;

sendMessage = function(msg) {
    if (ws !== undefined && ws.readyState === 1) {
        ws.send(JSON.stringify(msg));
    }
};



open_WS_connection = function() {

    //ws = new WebSocket('wss://stream33.forexpros.com/echo/330/qa2gt7qw/websocket', {
    ws = new WebSocket('wss://stream113.forexpros.com/echo/030/erxjdwad/websocket', {
        origin: 'https://www.investing.com'
    });

    ws.on('close', function(code, message) {
        console.log('disconnected');
        //ws.send(Date.now());

        // reconnection

        open_WS_connection();

    });



    ws.on('message', function incoming(data) {
        //console.log(`Roundtrip time: ${Date.now() - data} ms`);

        //setTimeout(function timeout() {
        //    ws.send(Date.now());
        //}, 500);

        if (data === 'o') {
            console.log('reconnected');
            console.log(pidArray);

            for (var i = 0, len = pidArray.length; i < len; i++) {
                sendMessage('{"_event":"subscribe","tzID":55,"message":"pid-' + pidArray[i] + ':" }');
                //sendMessage('{"_event":"subscribe","tzID":55,"message":"pidExt-' + pidArray[i] + ':" }');
            }

            sendMessage({ "_event": "UID", "UID": 0 });
            sendMessage({ "_event": "heartbeat", "data": "h" });

            setInterval(function() {
                sendMessage({ "_event": "heartbeat", "data": "h" });
            }, 2000);

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

                    pool.query(updateQuery)
                        .then(res => {
                            //console.log(res.command + ' : ' + pid + ' ' + pcp + ' ' + res.rowCount + ' row(s)');
                        })
                        .catch(err => {
                            console.log(updateQuery.values);
                            console.error(err.stack);
                        });

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
                    const turnover = jsonMsg.turnover;
                    const turnovernumeric = Math.round(turnover.replace(',', '').replace('M', '').replace('K', '') * (turnover.indexOf('M') > -1 ? 1000000 : 1) * (turnover.indexOf('K') > -1 ? 1000 : 1));
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
}


//open_WS_connection();





refreshList = function(listname) {
    var ipath;
    if (new Date().getHours() < 9 || new Date().getHours() == 9 && new Date().getHours() <= 30) {
        ipath = '/equities/' + listname; ///equities/pre-market';
    } else if (new Date().getHours() >= 9 && new Date().getHours() < 16 || new Date().getHours() == 16 && new Date().getMinutes() == 0) {
        ipath = '/equities/' + listname;
    } else {
        //return;
        ipath = '/equities/' + listname;
    }
    /*else if (new Date().gethours() >= 16) {
           ipath = '';
       }*/


    const options = {
        hostname: 'www.investing.com',
        port: 443,
        path: ipath, //'/equities/top-stock-gainers',
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

                var time = $('td[class="pid-' + pid + '-time"]', item)[0].childNodes[0].data;
                if (time.indexOf('/') > -1) {
                    time = '16:00:00';
                    //return;
                }

                const fullname = $('td[class="left bold plusIconTd elp"] > a', item).prop('title');
                const url = $('td[class="left bold plusIconTd elp"] > a', item).prop('href');
                const name = $('td[class="left bold plusIconTd elp"] > a', item)[0].childNodes[0].data;

                const last = $('td[class="align_right pid-' + pid + '-last"]', item)[0].childNodes[0].data;
                const high = $('td[class="align_right pid-' + pid + '-high"]', item)[0].childNodes[0].data;
                const low = $('td[class="pid-' + pid + '-low"]', item)[0].childNodes[0].data;
                const pc = $('td[class="bold greenFont pid-' + pid + '-pc"]', item)[0] === undefined ? '' : $('td[class="bold greenFont pid-' + pid + '-pc"]', item)[0].childNodes[0].data;

                const pcp = $('td[class="bold greenFont pid-' + pid + '-pcp"]', item)[0] === undefined ? '' : $('td[class="bold greenFont pid-' + pid + '-pcp"]', item)[0].childNodes[0].data;
                const pcpnumeric = parseFloat(pcp.replace('%', ''));

                const turnover = $('td[class="pid-' + pid + '-turnover"]', item)[0] === undefined ? '' : $('td[class="pid-' + pid + '-turnover"]', item)[0].childNodes[0].data;
                const turnovernumeric = turnover == '' ? 0 : Math.round(turnover.replace(',', '').replace('M', '').replace('K', '') * (turnover.indexOf('M') > -1 ? 1000000 : 1) * (turnover.indexOf('K') > -1 ? 1000 : 1));


                var times = time.split(':');
                time = ('0' + (parseInt(times[0]) - 4).toString()).substr((parseInt(times[0]) - 4 > 9 ? 1 : 0), 2) + ':' + times[1] + ':' + times[2];

                var date = new Date();
                date.setHours(0, 0, 0, 0);

                if (pidArray.indexOf(pid) === -1) {
                    pidArray.push(pid);

                    sendMessage('{"_event":"subscribe","tzID":55,"message":"pid-' + pid.toString() + ':" }');
                    sendMessage('{"_event":"subscribe","tzID":55,"message":"pidExt-' + pid.toString() + ':" }');

                    // add to iqmap : pid, url
                    const updateQuery = {
                        text: `INSERT INTO t.iqmap(pid, url) VALUES ($1, $2)`,
                        values: [pid, url]
                    };
                    pool.query(updateQuery)
                        .then(res => {
                            console.log(res.command + ' : ' + pid + ' ' + url + ' ' + res.rowCount + ' row(s)');
                        })
                        .catch(err => {
                            console.error(err.stack);
                        });




                }


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

/*
setInterval(function() {
    refreshList();
}, 30000);
*/

//refreshList();


const schedule = require('node-schedule');

var job1 = schedule.scheduleJob('59 42 20 9 8 *', function() {
    console.log('open_WS_connection() - ' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString());

    var job2 = schedule.scheduleJob('13 */1 * * * *', function() {
        console.log('startTime - ' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString());
        //refreshList('top-stock-gainers?country=usa');
        refreshList('top-stock-losers?country=usa');
    });

    open_WS_connection();
});