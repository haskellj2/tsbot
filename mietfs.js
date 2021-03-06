var Mietfs = function() {};

Mietfs.prototype.saveEODdata = function() {

    const https = require('https');
    const cheerio = require('cheerio');

    const { Pool } = require('pg');

    const botdbConfig = require('./ts_configurations').get_bot_db_config();
    const pool = new Pool(botdbConfig);


    //if (new Date().getHours() == 9 && new Date().getMinutes <= 31 && new Date().getseconds <= 15) {
    //    return;
    //}


    saveETFsData = function(url = '/etfs/usa-etfs') {
        const options = {
            hostname: 'www.investing.com',
            port: 443,
            path: url,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Mobile Safari/537.36',
                'accept': '*/*'
            },

        };

        const color = 'green';

        var iResponse = '';

        const req = https.request(options, (res) => {

            console.log('statusCode', res.statusCode);
            console.log('statusMessage', res.statusMessage);

            res.on('data', (d) => {
                //process.stdout.write(d);
                if (iResponse.length < 1200000) {
                    iResponse += d;
                }
            });

            res.on('end', () => {
                iResponse = iResponse.substr(iResponse.indexOf('<table id="etfs" tablesorter class="genTbl closedTbl crossRatesTbl elpTbl elp40">'));
                iResponse = iResponse.substr(0, iResponse.indexOf("</table>") + 8);
                //console.log(iResponse);

                const $ = cheerio.load(iResponse);
                $('table.genTbl > tbody > tr').each((idx, item) => {
                    const pid = $('td[class="bold left noWrap elp plusIconTd"] > span', item).prop('data-id'); //
                    const volume = $('td[class="bold left noWrap elp plusIconTd"] > span', item).prop('data-volume').replace(/,/g, ''); //

                    const timevalue = $('td[ class=" pid-' + pid + '-time"]', item).prop('data-value'); //

                    const fullname = $('td[class="bold left noWrap elp plusIconTd"] > a', item).prop('title'); //
                    const url = $('td[class="bold left noWrap elp plusIconTd"] > a', item).prop('href'); //
                    const name = $('td[class="bold left noWrap elp plusIconTd"] > a', item)[0].childNodes[0].data; //
                    const symb = $('td[class="left symbol"]', item).prop('title'); //

                    const last = $('td[class="pid-' + pid + '-last"]', item)[0].childNodes[0].data; //
                    const pcp = $('td[class="bold ' + color + 'Font pid-' + pid + '-pcp"]', item)[0] !== undefined ? //
                        $('td[class="bold ' + color + 'Font pid-' + pid + '-pcp"]', item)[0].childNodes[0].data :
                        $('td[class="bold ' + (color === "green" ? "red" : "green") + 'Font pid-' + pid + '-pcp"]', item)[0] !== undefined ?
                        $('td[class="bold ' + (color === "green" ? "red" : "green") + 'Font pid-' + pid + '-pcp"]', item)[0].childNodes[0].data :
                        '';

                    const pcpnumeric = pcp !== '' ? parseFloat(pcp.replace('%', '')) : 0.0; //

                    const turnover = $('td[class=" pid-' + pid + '-turnover"]', item)[0].childNodes[0].data; //
                    const turnovernumeric = Math.round(turnover.replace(',', '').replace('M', '').replace('K', '') * (turnover.indexOf('M') > -1 ? 1000000 : 1) * (turnover.indexOf('K') > -1 ? 1000 : 1)); //

                    var time = $('td[class=" pid-' + pid + '-time"]', item)[0].childNodes[0].data; //
                    if (time.indexOf('/') > -1) {
                        time = '16:00:00';
                    } else {
                        var times = time.split(':');
                        time = ('0' + (parseInt(times[0]) - 4).toString()).substr((parseInt(times[0]) - 4 > 9 ? 1 : 0), 2) + ':' + times[1] + ':' + times[2];
                    }

                    var date = new Date(); //
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
                            text: 'SELECT * FROM t.ietfs WHERE pid = $1 AND time = $2 AND date = $3',
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
                                        text: 'INSERT INTO t.ietfs(pid, name, time, timevalue, last, pcp, turnover, date, fullname, url, symb, pcpnumeric, turnovernumeric, volume) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
                                        values: [parseInt(pid), name, time, timevalue, parseFloat(last), pcp, turnover, date, fullname, url, symb, pcpnumeric, turnovernumeric, volume]
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


    // url: top-stock-gainers?country=usa
    // tablename: igainers

    // url: top-stock-gainers?country=usa
    // tablename: igainers
    /*
        let urlg = 'top-stock-gainers?country=usa';
        let tablenameg = 'igainers';
        saveMoversData(urlg, tablenameg);

        let urll = 'top-stock-losers?country=usa';
        let tablenamel = 'ilosers';
        saveMoversData(urll, tablenamel);
    */
    saveETFsData();
};

module.exports = new Mietfs();