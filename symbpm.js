var pidArray = [278]; //[1, 2, 3, 5, 7, 8830, 8839, 8874];


const https = require('https');
const cheerio = require('cheerio');

const { Pool } = require('pg');

const botdbConfig = require('./ts_configurations').get_bot_db_config();
const pool = new Pool(botdbConfig);



populateSymbols = function() {
    // add to iqmap : pid, url
    const symbQuery = {
        text: `SELECT pid, url FROM t.iqmap WHERE symb is null`
    };
    pool.query(symbQuery)
        .then(res2 => {
            var symbrows = res2.rows;
            symbrows.forEach((val, idx) => {
                const pid = val.pid;
                const ipath = val.url; //val.url.indexOf('?') > -1 ? val.url.substr(0, val.url.indexOf('?')) : val.url;
                console.log('$' + pid + '$');
                console.log('$' + ipath + '$');
                const options = {
                    hostname: 'www.investing.com',
                    port: 443,
                    path: ipath,
                    method: 'GET',
                    headers: {
                        //GET /equities/bio-blast-phrma HTTP/1.1
                        'Host': 'm.investing.com',
                        'Connection': 'keep-alive',
                        'Pragma': 'no-cache',
                        'Cache-Control': 'no-cache',
                        'Upgrade-Insecure-Requests': 1,
                        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Mobile Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                        //'Accept-Encoding': 'gzip, deflate, br',
                        'Accept-Language': 'en-US,en;q=0.8',
                        'Cookie': 'adBlockerNewUserDomains=1501515428; optimizelyEndUserId=oeu1501515428667r0.0340354869914794; __qca=P0-2126023527-1501515430057; __gads=ID=e7109d48c505ef50:T=1501515430:S=ALNI_MacnlvN1rvVaQTFSE5Ez8myCJlHoQ; PHPSESSID=eqb4sssjaheingp0765lrk7fe3; StickySession=id.93043251681.209.m.investing.com; optimizelySegments=%7B%224225444387%22%3A%22gc%22%2C%224226973206%22%3A%22referral%22%2C%224232593061%22%3A%22false%22%2C%225010352657%22%3A%22none%22%2C%225799410008%22%3A%22gc%22%2C%225803260009%22%3A%22none%22%2C%225796780005%22%3A%22direct%22%2C%225793730061%22%3A%22true%22%7D; optimizelyBuckets=%7B%228465822231%22%3A%228464003526%22%2C%228543560511%22%3A%220%22%7D; _ga=GA1.2.124552790.1501515429; _gat_allSitesTracker=1; _gat=1'



                    },
                };






                var iResponse = '';

                const req = https.request(options, (res) => {
                    //console.log('statusCode', res.statusCode);
                    //console.log('statusMessage', res.statusMessage);

                    res.on('data', (d) => {
                        //console.log(d);
                        //process.stdout.write(d);
                        if (iResponse.length <= 900) {
                            iResponse += d;
                        } else {
                            return;
                        }

                        if (iResponse.length > 900) {
                            return;
                        }
                    });

                    res.on('end', () => {
                        //console.log(iResponse);
                        iResponse.substr(0, 900);
                        const symb = iResponse.substr(iResponse.indexOf('<title>') + 7, iResponse.substr(iResponse.indexOf('<title>') + 7).indexOf('|') - 1);
                        console.log('$' + pid + '$');
                        console.log('$' + ipath + '$');
                        console.log('$' + symb + '$');

                        // add to iqmap : pid, url
                        const updateQuery = {
                            text: `UPDATE t.iqmap SET symb = $1 WHERE pid = $2`,
                            values: [symb, pid]
                        };
                        pool.query(updateQuery)
                            .then(res => {
                                console.log(res.command + ' : ' + pid + ' ' + symb + ' ' + res.rowCount + ' row(s)');
                            })
                            .catch(err => {
                                console.error(err.stack);
                            });
                        /*

    <head>
        <meta charset="utf-8">
        <title>STS | Supreme Industries Stock - Investing.com</title>
                        */

                        /*
                        if (iResponse.length < 35000) {

                        <section class="boxItemPairData">
                            <div class="pairData">
                                    <div class="pairDataContent">
                                                    <span class="pairDataTitle">Bid / Ask</span>
                                        <span class="pairDataAttr starsOnlyInner">20.850 / 20.980</span>
                                            </div>
                                    <div class="pairDataContent">
                                                    <span class="pairDataTitle">Day's Range</span>
                                        <span class="pairDataAttr starsOnlyInner">20.94 - 20.99</span>
                                            </div>
                                    <div class="pairDataContent">
                                                    <span class="pairDataTitle">52 wk Range</span>
                                        <span class="pairDataAttr starsOnlyInner">11.03 - 22</span>
                                            </div>
                                    <div class="pairDataContent">
                                                    <span class="pairDataTitle">Prev. Close</span>
                                        <span class="pairDataAttr starsOnlyInner">20.98</span>
                                            </div>
                                    <div class="pairDataContent">
                                                    <span class="pairDataTitle">Open</span>
                                        <span class="pairDataAttr starsOnlyInner">20.96</span>
                                            </div>
                                    <div class="pairDataContent">
                                                    <span class="pairDataTitle">Volume (Average)</span>
                                        <span class="pairDataAttr"><i class="js-amount-value">658,673</i> (<i class="js-amount-value">173,903</i>)</span>
                                            </div>
                                    <div class="pairDataContent">
                                                    <span class="pairDataTitle">Market Cap</span>
                                        <span class="pairDataAttr starsOnlyInner">359.51M</span>
                                            </div>
                                    <div class="pairDataContent">
                                                    <span class="pairDataTitle">Beta</span>
                                        <span class="pairDataAttr starsOnlyInner">0.82</span>
                                            </div>
                                    <div class="pairDataContent">
                                                    <span class="pairDataTitle">P/E Ratio</span>
                                        <span class="pairDataAttr starsOnlyInner">23.76</span>
                                            </div>
                                    <div class="pairDataContent">
                                                    <span class="pairDataTitle">Dividend (Yield)</span>
                                        <span class="pairDataAttr starsOnlyInner">0.14 (0.67%)</span>
                                            </div>
                                    <div class="pairDataContent">
                                                    <span class="pairDataTitle">Revenue</span>
                                        <span class="pairDataAttr starsOnlyInner">300.79M</span>
                                            </div>
                                    <div class="pairDataContent">
                                                    <span class="pairDataTitle">EPS</span>
                                        <span class="pairDataAttr starsOnlyInner">0.88</span>
                                            </div>
                                    <div class="pairDataContent">
                                                    <span class="pairDataTitle">Next Earnings Date</span>
                                        <span class="pairDataAttr starsOnlyInner">N/A</span>
                                            </div>
                                    <div class="pairDataContent">
                                                    <span class="pairDataTitle">1-Year Change</span>
                                        <span class="pairDataAttr starsOnlyInner">33.61%</span>
                                            </div>
                            </div>
                        </section>
                        */
                    });
                });

                //req.on('error', (e) => {
                //    console.error(e);
                //});

                req.end(function() {
                    //console.log('req end');
                });
            }); // loop over pids
        })
        .catch(err => {
            console.error(err.stack);
        });
};




populateSymbols();