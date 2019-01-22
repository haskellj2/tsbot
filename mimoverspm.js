var Mimoverspm = function() {};

Mimoverspm.prototype.saveTopDailyGLs = function() {

    const https = require('https');
    const cheerio = require('cheerio');

    const { Pool } = require('pg');

    const botdbConfig = require('./ts_configurations').get_bot_db_config();
    const pool = new Pool(botdbConfig);


    const Msymb = require('./msymb.js');


    //if (new Date().getHours() == 9 && new Date().getMinutes <= 31 && new Date().getseconds <= 15) {
    //    return;
    //}



    saveMoversData = function(url, tablenm) {
        const options = {
            hostname: 'www.investing.com',
            port: 443,
            path: '/equities/' + url,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Mobile Safari/537.36',
                'accept': '*/*'
            },

        };

        const color = tablenm === 'igainers' ? 'green' : 'red';

        var iResponse = '';

        const req = https.request(options, (res) => {

            console.log('statusCode', res.statusCode);
            console.log('statusMessage', res.statusMessage);

            res.on('data', (d) => {
                //process.stdout.write(d);
                if (iResponse.length < 500000) {
                    iResponse += d;
                }
            });

            res.on('end', () => {
                iResponse = iResponse.substr(iResponse.indexOf("genTbl closedTbl elpTbl elp25 crossRatesTbl") - 14, 50000);
                iResponse = iResponse.substr(0, iResponse.indexOf("</table>") + 8);
                //console.log(iResponse);

                const $ = cheerio.load(iResponse);
                $('table.genTbl > tbody > tr').each((idx, item) => {
                    const pid = $('td[class="left bold plusIconTd elp"] > span', item).prop('data-id');

                    const fullname = $('td[class="left bold plusIconTd elp"] > a', item).prop('title');
                    const url = $('td[class="left bold plusIconTd elp"] > a', item).prop('href');
                    const name = $('td[class="left bold plusIconTd elp"] > a', item)[0].childNodes[0].data;

                    const last = $('td[class="align_right pid-' + pid + '-last"]', item)[0].childNodes[0].data;
                    const high = $('td[class="align_right pid-' + pid + '-high"]', item)[0].childNodes[0].data;
                    const low = $('td[class="pid-' + pid + '-low"]', item)[0].childNodes[0].data;

                    const pc = $('td[class="bold ' + color + 'Font pid-' + pid + '-pc"]', item)[0] !== undefined ?
                        $('td[class="bold ' + color + 'Font pid-' + pid + '-pc"]', item)[0].childNodes[0].data :
                        $('td[class="bold ' + (color === "green" ? "red" : "green") + 'Font pid-' + pid + '-pc"]', item)[0] !== undefined ?
                        $('td[class="bold ' + (color === "green" ? "red" : "green") + 'Font pid-' + pid + '-pc"]', item)[0].childNodes[0].data :
                        '';

                    const pcp = $('td[class="bold ' + color + 'Font pid-' + pid + '-pcp"]', item)[0] !== undefined ?
                        $('td[class="bold ' + color + 'Font pid-' + pid + '-pcp"]', item)[0].childNodes[0].data :
                        $('td[class="bold ' + (color === "green" ? "red" : "green") + 'Font pid-' + pid + '-pcp"]', item)[0] !== undefined ?
                        $('td[class="bold ' + (color === "green" ? "red" : "green") + 'Font pid-' + pid + '-pcp"]', item)[0].childNodes[0].data :
                        '';

                    const pcpnumeric = pcp !== '' ? parseFloat(pcp.replace('%', '')) : 0.0;

                    const turnover = $('td[class="pid-' + pid + '-turnover"]', item)[0].childNodes[0].data;
                    const turnovernumeric = Math.round(turnover.replace(',', '').replace('M', '').replace('K', '') * (turnover.indexOf('M') > -1 ? 1000000 : 1) * (turnover.indexOf('K') > -1 ? 1000 : 1));

                    var time = $('td[class="pid-' + pid + '-time"]', item)[0].childNodes[0].data;
                    if (time.indexOf('/') > -1) {
                        time = '16:00:00';
                    } else {
                        var times = time.split(':');
                        time = ('0' + (parseInt(times[0]) - 4).toString()).substr((parseInt(times[0]) - 4 > 9 ? 1 : 0), 2) + ':' + times[1] + ':' + times[2];
                    }

                    var date = new Date();
                    date.setHours(0, 0, 0, 0);

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
                            text: 'SELECT * FROM t.' + tablenm + ' WHERE pid = $1 AND time = $2 AND date = $3',
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
                                        text: 'INSERT INTO t.' + tablenm + '(pid, last, high, low, pc, pcp, turnover, time, date, fullname, name, url, pcpnumeric, turnovernumeric) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
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

                                    Msymb.getSymbByPidUrl(pid, url)
                                        .then(function(res) {
                                            console.log('then pm: ' + res);

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


    // url: top-stock-gainers?country=usa
    // tablename: igainers

    // url: top-stock-gainers?country=usa
    // tablename: igainers

    let urlg = 'top-stock-gainers?country=usa';
    let tablenameg = 'igainers';
    saveMoversData(urlg, tablenameg);

    let urll = 'top-stock-losers?country=usa';
    let tablenamel = 'ilosers';
    saveMoversData(urll, tablenamel);

};

module.exports = new Mimoverspm();