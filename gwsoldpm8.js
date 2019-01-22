var pidArray = [8874, 651, 20, 44369, 44336, 959194, 8884, 6408, 6435, 252, 100160, 26490];




const https = require('https');
const cheerio = require('cheerio');

const { Pool } = require('pg');

const botdbConfig = require('./ts_configurations').get_bot_db_config();
const pool = new Pool(botdbConfig);




const WebSocket = require('ws');

var ws;

sendMessage = function(msg) {
    ////console.log(msg);

    if (ws !== undefined && ws.readyState === 1) {
        ws.send(JSON.stringify(msg));
    }
};


const Mheartbeat = require('./mheartbeat.js');


/*
var Extensions = require('websocket-extensions'),
    deflate    = require('permessage-deflate');

var exts = new Extensions();
exts.add(deflate);
*/




open_WS_connection = function() {


    ws = new WebSocket('wss://stream19.forexpros.com/echo/548/56pij6vf/websocket', {
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Connection': 'Upgrade',
        'origin': 'https://www.investing.com',
        'Pragma': 'no-cache',
        'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
        'Sec-WebSocket-Key': 'qs+Fx/O6UOI3h9C3JpXoGQ==',
        'Sec-WebSocket-Version': '13',
        'Upgrade': 'websocket',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Mobile Safari/537.36'

    });

    ws.on('close', function(code, message) {
        console.log('disconnected');

        // reconnection
        open_WS_connection();

    });



    ws.on('message', function incoming(data) {
        ////console.log(data);

        if (data === 'o') {
            console.log('reconnected');
            //console.log(pidArray);

            for (var i = 0, len = pidArray.length; i < len; i++) {
                sendMessage('{"_event":"subscribe","tzID":55,"message":"pid-' + pidArray[i] + ':" }');
                sendMessage('{"_event":"subscribe","tzID":55,"message":"pidExt-' + pidArray[i] + ':" }');
            }

            sendMessage('{ "_event": "subscribe", "tzID": 55, "message": "domain-1:" }');
            sendMessage('{ "_event": "UID", "UID": ' + '0' + ' }');

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

                    const pid = parseInt(jsonMsg.pid.replace(/,/g, ''));
                    const last = parseFloat(jsonMsg.last.replace(/,/g, ''));
                    const bid = parseFloat(jsonMsg.bid.replace(/,/g, ''));
                    const ask = parseFloat(jsonMsg.ask.replace(/,/g, ''));
                    const high = parseFloat(jsonMsg.high.replace(/,/g, ''));
                    const low = parseFloat(jsonMsg.low.replace(/,/g, ''));
                    let last_close = 0.00;
                    if (jsonMsg.last_close !== undefined) {
                        last_close = parseFloat(jsonMsg.last_close.replace(/,/g, ''));
                        if (isNaN(last_close)) { last_close = 0.00; }
                    }

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


//open_WS_connection();


refreshETFList = function(listname = '/etfs/usa-etfs') {
    //console.log('refreshList ' + listname + new Date().toLocaleTimeString());
    var ipath = listname;

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
        //console.log('statusCode', res.statusCode);
        //console.log('statusMessage', res.statusMessage);

        res.on('data', (d) => {
            //process.stdout.write(d);
            if (igResponse.length < 1200000) {
                igResponse += d;
            }
        });

        res.on('end', () => {
            igResponse = igResponse.substr(igResponse.indexOf('<table id="etfs" tablesorter class="genTbl closedTbl crossRatesTbl elpTbl elp40">'));
            igResponse = igResponse.substr(0, igResponse.indexOf("</table>") + 8);
            //console.log(igResponse);

            const $ = cheerio.load(igResponse);
            $('table.genTbl > tbody > tr').each((idx, item) => {
                const pid = $('td[class="bold left noWrap elp plusIconTd"] > span', item).prop('data-id');

                if (pidArray.indexOf(pid) === -1) {
                    pidArray.push(pid);

                    sendMessage('{"_event":"subscribe","tzID":55,"message":"pid-' + pid.toString() + ':" }');
                    sendMessage('{"_event":"subscribe","tzID":55,"message":"pidExt-' + pid.toString() + ':" }');


                    /*
                    // add to iqmap : pid, url
                    const updateQuery = {
                        text: `INSERT INTO t.iqmap(pid, url) VALUES ($1, $2)`,
                        values: [pid, url]
                    };
                    pool.query(updateQuery)
                        .then(res => {
                            console.log(res.command + ' : ' + pid + ' ' + url + ' ' + res.rowCount + ' row(s)');

                            Msymb.getSymbByPidUrl(pid, url)
                            .then(function(res) {
                                console.log('then 1: ' + res);
                        
                            });                            
                        })
                        .catch(err => {
                            console.error(err.stack);
                        });
                    */



                }


            });

            //console.log('table done');
        });
        //console.log('res end');
    });



    //req.on('error', (e) => {
    //    console.error(e);
    //});

    req.end(function() {
        //console.log('req end');
    });

};





function checkTime(i) {
    return (i < 10) ? "0" + i : i;
}

function getCurrentTime() {
    var today = new Date(),
        h = checkTime(today.getHours()),
        m = checkTime(today.getMinutes()),
        s = checkTime(today.getSeconds());
    return h + ":" + m + ":" + s;
}



/*
setInterval(function() {
    refreshList();
}, 30000);
*/

//refreshList();

const schedule = require('node-schedule');

const { minute, hour, day, month } = function(date) {
    date.setMinutes(date.getMinutes() + 1);
    return {
        minute: date.getMinutes(),
        hour: date.getHours(),
        day: date.getDate(),
        month: date.getMonth() + 1
    };
}(new Date());


//console.log('3 ' + minute.toString() + ' ' + hour.toString() + ' ' + day.toString() + ' ' + month.toString() + ' *');

var job1 = schedule.scheduleJob('5 ' + minute.toString() + ' ' + hour.toString() + ' ' + day.toString() + ' ' + month.toString() + ' *', function() {
    console.log('open_WS_connection() - ' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString());
    //var job2 = schedule.scheduleJob('13 */1 * * * *', function() {
    console.log('startTime - ' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString());
    //if (new Date().getHours() < 9 || new Date().getHours() == 9 && new Date().getMinutes() <= 31 || new Date().getHours() >= 16) {
    //refreshListPM('pre-market');
    refreshETFList();
    //}

    //if (new Date().getHours() > 9 && new Date().getHours() < 16 || new Date().getHours() == 9 && new Date().getMinutes() >= 30 || new Date().getHours() == 16 && new Date().getMinutes() <= 4) {
    //refreshList('top-stock-gainers?country=usa');
    //refreshList('top-stock-losers?country=usa');
    //}
    //});

    console.log('Keep sending heartbeat on the condition of ws being valid, every 3 seconds' + new Date().toLocaleTimeString());
    setInterval(function() {
        sendMessage('{ "_event": "heartbeat", "data": "h" }');
    }, 3000);

    open_WS_connection();

});


//refreshETFList();


//schedule.scheduleJob('43 */5 * * * *', function() {
//    Mheartbeat.sendHeartbeat();
//});



/*
Msymb.getSymbByPidUrl(257, '/equities/dell-inc')
.then(function(res) {
    console.log('then 1: ' + res);

});
console.log(s); // + ' ' + pid.toString() + ' ' + url);
*/

/*
const schedule = require('node-cron');

var job1 = schedule.schedule('59 20 8 10 8 *', function() {
    console.log('open_WS_connection() - ' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString());

    var job2 = schedule.schedule('13 *1 * * * *', function() {
        console.log('startTime - ' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString());
        refreshList('top-stock-gainers?country=usa');
        refreshList('top-stock-losers?country=usa');
    });

    job2.start();

    open_WS_connection();
});

job1.start();
*/